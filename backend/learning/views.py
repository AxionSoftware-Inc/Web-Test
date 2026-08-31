from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.utils.text import slugify
from django.utils import timezone
from rest_framework import decorators, response, status, viewsets

from learning.models import (
    Answer,
    ClassStudent,
    ClassTestAssignment,
    ExamPack,
    ExamPackItem,
    Question,
    RoleProfile,
    School,
    SchoolTeacher,
    Skill,
    Subject,
    TeacherClass,
    Test,
    TestQuestion,
    TestSession,
    Topic,
)
from learning.serializers import (
    AnswerSerializer,
    ClassStudentSerializer,
    ClassTestAssignmentSerializer,
    CreateTestSerializer,
    ExamPackItemSerializer,
    ExamPackSerializer,
    QuestionSerializer,
    RoleProfileSerializer,
    SchoolSerializer,
    SchoolTeacherSerializer,
    SkillSerializer,
    SubjectSerializer,
    TeacherClassSerializer,
    TestSerializer,
    TestSessionSerializer,
    TopicSerializer,
)
from learning.services.analytics import class_results_payload, exam_pack_results_payload


ASSIGNMENTS_WITH_COUNTS = ClassTestAssignment.objects.select_related("test").annotate(
    question_count=Count("test__questions", distinct=True),
)
PACK_ITEMS_WITH_COUNTS = ExamPackItem.objects.select_related("test").annotate(
    question_count=Count("test__questions", distinct=True),
)


def request_value(request, key, default=""):
    return request.data.get(key, request.query_params.get(key, default))


def require_manage_code(request, expected):
    if not expected:
        return None
    provided = request_value(request, "manage_code")
    if provided != expected:
        return response.Response({"detail": "Valid manage code is required."}, status=status.HTTP_403_FORBIDDEN)
    return None


def require_manage_key(request, expected):
    if not expected:
        return None
    provided = request_value(request, "manage_key")
    if provided != expected:
        return response.Response({"detail": "Valid manage key is required."}, status=status.HTTP_403_FORBIDDEN)
    return None


def unique_slug(model, base):
    value = slugify(base or "item")[:50] or "item"
    candidate = value
    index = 2
    while model.objects.filter(slug=candidate).exists():
        suffix = f"-{index}"
        candidate = f"{value[:50 - len(suffix)]}{suffix}"
        index += 1
    return candidate


def normalize_test_difficulty(value):
    normalized = str(value or "").lower().strip()
    if normalized in {"easy", "beginner", "foundation", "foundations"}:
        return Question.Difficulty.BEGINNER
    if normalized in {"medium", "intermediate"}:
        return Question.Difficulty.INTERMEDIATE
    if normalized in {"hard", "advanced"}:
        return Question.Difficulty.ADVANCED
    return Question.Difficulty.BEGINNER


def normalize_question_type(value):
    normalized = str(value or "").lower().strip()
    if normalized in {"multiple_choice", "multiple-choice"}:
        return Question.QuestionType.MULTIPLE_CHOICE
    if normalized in {"short_answer", "short-answer"}:
        return Question.QuestionType.SHORT_ANSWER
    return Question.QuestionType.SINGLE_CHOICE


def first_text(data, keys, default=""):
    if not isinstance(data, dict):
        return default
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return str(value).strip()
    return default


def positive_int(value, default):
    try:
        parsed = int(float(str(value).strip().split()[0]))
        return parsed if parsed > 0 else default
    except (TypeError, ValueError, IndexError):
        return default


def positive_id(value):
    try:
        parsed = int(value)
        return parsed if parsed > 0 else None
    except (TypeError, ValueError):
        return None


def string_list(value, default=None):
    if isinstance(value, list):
        rows = [str(item).strip() for item in value if str(item).strip()]
    elif isinstance(value, str):
        rows = [item.strip() for item in value.replace("\n", ",").replace("|", ",").split(",") if item.strip()]
    else:
        rows = []
    return rows or (default or [])


def normalize_import_options(raw_options):
    if isinstance(raw_options, dict):
        return [{"id": key, "text": str(value)} for key, value in raw_options.items() if str(value).strip()]
    if not isinstance(raw_options, list):
        return []
    option_ids = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    rows = []
    for index, option in enumerate(raw_options):
        fallback_id = option_ids[index] if index < len(option_ids) else str(index + 1)
        if isinstance(option, dict):
            text = first_text(option, ["text", "label", "value", "body", "title"])
            option_id = first_text(option, ["id", "key"], fallback_id)
        else:
            text = str(option).strip()
            option_id = fallback_id
        if text:
            rows.append({"id": option_id, "text": text})
    return rows


def normalize_import_questions(test_data):
    rows = []
    if isinstance(test_data, dict):
        rows = test_data.get("questions") or test_data.get("test_questions") or test_data.get("savollar") or []
    if not isinstance(rows, list):
        return []
    normalized = []
    for row in rows:
        if isinstance(row, dict) and isinstance(row.get("question"), dict):
            row = row["question"]
        if isinstance(row, dict):
            normalized.append(row)
    return normalized


def import_error(layer, code, message, field=None, http_status=status.HTTP_400_BAD_REQUEST, **extra):
    payload = {
        "detail": message,
        "layer": layer,
        "code": code,
    }
    if field:
        payload["field"] = field
    payload.update(extra)
    return response.Response(payload, status=http_status)


def import_skip(title, layer, code, reason, field=None):
    row = {
        "title": title,
        "layer": layer,
        "code": code,
        "reason": reason,
    }
    if field:
        row["field"] = field
    return row


def cleanup_empty_exam_packs():
    ExamPack.objects.annotate(item_total=Count("items")).filter(item_total=0).delete()


def exam_pack_title_exists(title, exclude_id=None):
    value = str(title or "").strip()
    if not value:
        return False
    queryset = ExamPack.objects.filter(title__iexact=value)
    if exclude_id:
        queryset = queryset.exclude(id=exclude_id)
    return queryset.exists()


@decorators.api_view(["GET", "PATCH"])
def role_profile(request):
    identity_code = request.query_params.get("identity_code", "").strip() or request.data.get("identity_code", "").strip()
    if not identity_code:
        return response.Response({"identity_code": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = RoleProfile.objects.get_or_create(identity_code=identity_code)
    if request.method == "GET":
        return response.Response(RoleProfileSerializer(profile).data)

    requested_role = request.data.get("active_role")
    if requested_role and requested_role == RoleProfile.Role.ADMIN and "admin" not in profile.available_roles:
        return response.Response({"active_role": "Only admin accounts can switch to admin."}, status=status.HTTP_403_FORBIDDEN)
    serializer = RoleProfileSerializer(profile, data={**request.data, "identity_code": identity_code}, partial=True)
    serializer.is_valid(raise_exception=True)
    profile = serializer.save()
    return response.Response(RoleProfileSerializer(profile).data)


@decorators.api_view(["GET"])
def role_profile_search(request):
    role = request.query_params.get("role", "").strip()
    query = request.query_params.get("q", "").strip()
    queryset = RoleProfile.objects.all().order_by("display_name")[:0]
    if query:
        queryset = RoleProfile.objects.filter(email__icontains=query).order_by("email")[:8]
        if role:
            queryset = [profile for profile in queryset if profile.active_role == role or role in profile.available_roles]
    return response.Response(RoleProfileSerializer(queryset, many=True).data)


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by("title")
    serializer_class = SubjectSerializer
    lookup_field = "slug"

    @decorators.action(detail=True, methods=["get"])
    def topics(self, request, slug=None):
        subject = self.get_object()
        topics = (
            Topic.objects.filter(subject=subject)
            .annotate(test_count=Count("tests", distinct=True))
            .order_by("title")
        )
        return response.Response(TopicSerializer(topics, many=True).data)


class TopicViewSet(viewsets.ModelViewSet):
    queryset = (
        Topic.objects.select_related("subject")
        .annotate(test_count=Count("tests", distinct=True))
        .all()
        .order_by("subject__title", "title")
    )
    serializer_class = TopicSerializer
    lookup_field = "slug"

    def get_queryset(self):
        queryset = super().get_queryset()
        subject = self.request.query_params.get("subject")
        return queryset.filter(subject__slug=subject) if subject else queryset

    @decorators.action(detail=True, methods=["get"])
    def levels(self, request, slug=None):
        topic = self.get_object()
        tests = list(
            Test.objects.filter(topic=topic)
            .select_related("subject", "topic")
            .prefetch_related("testquestion_set__question__skills")
            .order_by("difficulty", "title")
        )
        tests_by_difficulty = {difficulty: [] for difficulty, _ in Question.Difficulty.choices}
        for test in tests:
            tests_by_difficulty.setdefault(test.difficulty, []).append(test)
        data = []
        for difficulty, label in Question.Difficulty.choices:
            difficulty_tests = tests_by_difficulty[difficulty]
            data.append(
                {
                    "difficulty": difficulty,
                    "label": label,
                    "test_count": len(difficulty_tests),
                    "tests": TestSerializer(difficulty_tests, many=True).data,
                }
            )
        return response.Response(data)

    @decorators.action(detail=True, methods=["get"])
    def tests(self, request, slug=None):
        topic = self.get_object()
        queryset = Test.objects.filter(topic=topic).select_related("subject", "topic").prefetch_related("testquestion_set__question__skills")
        status_filter = request.query_params.get("status")
        if not status_filter:
            queryset = queryset.filter(status=Test.PublishStatus.PUBLISHED)
        difficulty = request.query_params.get("difficulty")
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return response.Response(TestSerializer(queryset, many=True).data)


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.select_related("topic").all().order_by("topic__title", "title")
    serializer_class = SkillSerializer


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related("subject", "topic").prefetch_related("skills").all().order_by("-id")
    serializer_class = QuestionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        filters = {
            "subject__slug": self.request.query_params.get("subject"),
            "topic__slug": self.request.query_params.get("topic"),
            "difficulty": self.request.query_params.get("difficulty"),
            "type": self.request.query_params.get("type"),
        }
        return queryset.filter(**{key: value for key, value in filters.items() if value})


class TestViewSet(viewsets.ModelViewSet):
    queryset = (
        Test.objects.select_related("subject", "topic")
        .prefetch_related("testquestion_set__question__skills")
        .all()
        .order_by("topic__title", "difficulty", "title")
    )
    serializer_class = TestSerializer
    lookup_field = "slug"

    def get_serializer_class(self):
        return CreateTestSerializer if self.action in {"create", "update", "partial_update"} else TestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test = serializer.save()
        return response.Response(TestSerializer(test).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        denied = require_manage_key(request, instance.manage_key)
        if denied:
            return denied
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        test = serializer.save()
        return response.Response(TestSerializer(test).data)

    def get_queryset(self):
        queryset = super().get_queryset()
        filters = {
            "subject__slug": self.request.query_params.get("subject"),
            "topic__slug": self.request.query_params.get("topic"),
            "difficulty": self.request.query_params.get("difficulty"),
            "status": self.request.query_params.get("status"),
        }
        return queryset.filter(**{key: value for key, value in filters.items() if value})

    def destroy(self, request, *args, **kwargs):
        test = self.get_object()
        denied = require_manage_key(request, test.manage_key)
        if denied:
            return denied
        if test.sessions.exists():
            test.status = Test.PublishStatus.DRAFT
            test.save(update_fields=["status", "updated_at"])
            return response.Response(TestSerializer(test).data)
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=False, methods=["post"], url_path="import-pack")
    @transaction.atomic
    def import_pack(self, request):
        data = request.data.get("source", request.data)
        if not isinstance(data, dict):
            return import_error("backend_schema", "source_not_object", "Expected a JSON object.", "source")
        if data.get("version") != "1.0":
            return import_error("backend_schema", "unsupported_version", "Only version 1.0 is supported.", "version")
        pack_data = data.get("pack")
        tests_data = data.get("tests")
        if not isinstance(pack_data, dict):
            return import_error("backend_schema", "pack_missing", "Pack object is required.", "pack")
        if not isinstance(tests_data, list) or not tests_data:
            return import_error("backend_schema", "tests_missing", "At least one test is required.", "tests")
        if exam_pack_title_exists(pack_data.get("title")):
            return import_error("backend_schema", "pack_title_duplicate", "A pack with this title already exists. Rename the pack before importing.", "pack.title")

        subject_slug = slugify(pack_data.get("subject") or "math")
        subject, _ = Subject.objects.get_or_create(
            slug=subject_slug,
            defaults={"title": str(pack_data.get("subject") or "Math").replace("-", " ").title()},
        )
        creator_code = request.data.get("creator_code", "")
        manage_key = request.data.get("manage_key") or creator_code
        pack = ExamPack.objects.create(
            title=pack_data.get("title") or "Imported pack",
            slug=unique_slug(ExamPack, pack_data.get("title") or "imported-pack"),
            description=f"{pack_data.get('branch', '')} / {pack_data.get('level', '')} / {pack_data.get('language', '')}".strip(" /"),
            exam_type=f"{subject_slug}:{pack_data.get('branch', '')}:{pack_data.get('level', '')}".strip(":"),
            visibility=ExamPack.Visibility.PRIVATE,
            access_code="",
            manage_code=request.data.get("pack_manage_code") or manage_key,
            price_label="",
            is_active=True,
        )

        created_tests = []
        skipped = []
        for order, test_data in enumerate(tests_data, start=1):
            test_title = test_data.get("title", f"Test {order}") if isinstance(test_data, dict) else f"Test {order}"
            if not isinstance(test_data, dict):
                skipped.append(import_skip(test_title, "backend_schema", "test_not_object", "Test row must be an object.", f"tests[{order - 1}]"))
                continue
            raw_questions = normalize_import_questions(test_data)
            valid_questions = [
                question for question in raw_questions
                if first_text(question, ["body", "prompt", "question", "text", "savol", "matn"])
            ]
            if not raw_questions:
                skipped.append(import_skip(test_title, "backend_schema", "questions_missing", "Test has no questions array.", f"tests[{order - 1}].questions"))
                continue
            if not valid_questions:
                skipped.append(import_skip(test_title, "backend_schema", "question_prompt_missing", "All questions are missing prompt/body text.", f"tests[{order - 1}].questions"))
                continue
            try:
                topic_slug = slugify(test_data.get("topic") or pack_data.get("branch") or test_data.get("title") or f"topic-{order}")
                topic, _ = Topic.objects.get_or_create(
                    subject=subject,
                    slug=topic_slug,
                    defaults={
                        "title": str(test_data.get("topic") or topic_slug).replace("-", " ").title(),
                        "description": pack_data.get("branch", ""),
                    },
                )
                difficulty = normalize_test_difficulty(test_data.get("difficulty"))
                test = Test.objects.create(
                    title=test_data.get("title") or f"Imported test {order}",
                    slug=unique_slug(Test, test_data.get("title") or f"imported-test-{order}"),
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    estimated_minutes=positive_int(
                        test_data.get("time_limit_minutes")
                        or test_data.get("estimated_minutes")
                        or test_data.get("estimatedMinutes")
                        or test_data.get("minutes"),
                        10,
                    ),
                    passing_score=70,
                    status=Test.PublishStatus.PUBLISHED,
                    creator_name=request.data.get("creator_name") or "Importer",
                    creator_code=creator_code,
                    manage_key=manage_key,
                )
                created_question_count = 0
                for question_order, question_data in enumerate(valid_questions, start=1):
                    skill_ids = []
                    for skill_slug_raw in string_list(
                        question_data.get("skills") or question_data.get("skill") or question_data.get("tags") or question_data.get("konikmalar"),
                        ["general"],
                    ):
                        skill_slug = slugify(skill_slug_raw)
                        skill, _ = Skill.objects.get_or_create(
                            topic=topic,
                            slug=skill_slug or "general",
                            defaults={"title": str(skill_slug_raw).replace("-", " ").title()},
                        )
                        skill_ids.append(skill.id)
                    if not skill_ids:
                        skill, _ = Skill.objects.get_or_create(topic=topic, slug="general", defaults={"title": "General"})
                        skill_ids.append(skill.id)
                    options = normalize_import_options(question_data.get("options") or question_data.get("choices") or question_data.get("answers") or question_data.get("variantlar"))
                    option_texts = [option["text"] for option in options]
                    answer_data = question_data.get("answer") or question_data.get("javob")
                    correct_id = first_text(answer_data, ["correct", "id", "value", "text"]) if isinstance(answer_data, dict) else (
                        question_data.get("correct")
                        or question_data.get("correct_answer")
                        or question_data.get("correctAnswer")
                        or question_data.get("answer_key")
                        or question_data.get("answerKey")
                        or question_data.get("togri_javob")
                        or question_data.get("to'g'ri_javob")
                        or answer_data
                    )
                    answer_text = next((option["text"] for option in options if str(option["id"]) == str(correct_id)), str(correct_id or ""))
                    question = Question.objects.create(
                        subject=subject,
                        topic=topic,
                        type=normalize_question_type(question_data.get("type")),
                        difficulty=normalize_test_difficulty(question_data.get("difficulty") or test_data.get("difficulty")),
                        prompt=first_text(question_data, ["body", "prompt", "question", "text", "savol", "matn"]),
                        options=option_texts,
                        answer=answer_text,
                        explanation=first_text(question_data, ["explanation", "solution", "commentary", "yechim", "izoh"]),
                    )
                    question.skills.set(Skill.objects.filter(id__in=skill_ids, topic=topic))
                    TestQuestion.objects.create(test=test, question=question, order=question_order)
                    created_question_count += 1
                if created_question_count < 1:
                    test.delete()
                    skipped.append(import_skip(test.title, "backend_db", "questions_not_created", "No valid questions were saved.", f"tests[{order - 1}].questions"))
                    continue
                ExamPackItem.objects.create(pack=pack, test=test, title=test.title, order=order, is_required=True)
                created_tests.append(test)
            except Exception as exc:
                skipped.append(import_skip(test_title, "backend_db", "test_save_failed", str(exc), f"tests[{order - 1}]"))

        if not created_tests:
            pack.delete()
            return response.Response(
                {
                    "pack": None,
                    "tests": [],
                    "skipped": skipped,
                    "detail": "No tests were imported. Empty pack was not saved.",
                    "layer": "backend_db",
                    "code": "no_tests_imported",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return response.Response(
            {
                "pack": ExamPackSerializer(pack).data,
                "tests": TestSerializer(created_tests, many=True).data,
                "skipped": skipped,
            },
            status=status.HTTP_201_CREATED,
        )

    @decorators.action(detail=True, methods=["post"])
    def start(self, request, slug=None):
        test = self.get_object()
        if test.status != Test.PublishStatus.PUBLISHED:
            return response.Response({"detail": "Only published tests can be started."}, status=status.HTTP_400_BAD_REQUEST)
        session = TestSession.objects.create(
            test=test,
            student_name=request.data.get("student_name", "").strip(),
            student_code=request.data.get("student_code", "").strip(),
            user=request.user if request.user.is_authenticated else None,
        )
        return response.Response(TestSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class TestSessionViewSet(viewsets.ModelViewSet):
    queryset = TestSession.objects.select_related("test", "user").prefetch_related("answers").all().order_by("-created_at")
    serializer_class = TestSessionSerializer

    @decorators.action(detail=True, methods=["post"])
    def answer(self, request, pk=None):
        session = self.get_object()
        if session.status != TestSession.Status.IN_PROGRESS:
            return response.Response({"detail": "Submitted sessions cannot be changed."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = AnswerSerializer(data={**request.data, "session": session.id})
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["question"]
        if not TestQuestion.objects.filter(test=session.test_id, question_id=question.id).exists():
            return response.Response({"question": "Question does not belong to this test."}, status=status.HTTP_400_BAD_REQUEST)
        Answer.objects.update_or_create(
            session=session,
            question=question,
            defaults={
                "value": serializer.validated_data.get("value", ""),
                "is_flagged": serializer.validated_data.get("is_flagged", False),
            },
        )
        return response.Response(TestSessionSerializer(session).data)

    @decorators.action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        session = self.get_object()
        if session.status != TestSession.Status.IN_PROGRESS:
            return response.Response({"detail": "Session is already submitted."}, status=status.HTTP_400_BAD_REQUEST)
        session.status = TestSession.Status.SUBMITTED
        session.submitted_at = timezone.now()
        session.save(update_fields=["status", "submitted_at", "updated_at"])
        return response.Response(TestSessionSerializer(session).data)


class TeacherClassViewSet(viewsets.ModelViewSet):
    queryset = (
        TeacherClass.objects.prefetch_related(Prefetch("assignments", queryset=ASSIGNMENTS_WITH_COUNTS), "students")
        .all()
        .order_by("-created_at")
    )
    serializer_class = TeacherClassSerializer
    lookup_field = "slug"

    @decorators.action(detail=True, methods=["post"])
    def join(self, request, slug=None):
        classroom = self.get_object()
        join_code = request.data.get("join_code", "")
        student_name = request.data.get("student_name", "").strip()
        if classroom.visibility == TeacherClass.Visibility.PRIVATE and join_code != classroom.join_code:
            return response.Response({"detail": "Invalid join code."}, status=status.HTTP_403_FORBIDDEN)
        if not student_name:
            return response.Response({"student_name": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        student_code = request.data.get("student_code", "").strip()
        if not student_code:
            return response.Response({"student_code": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        student, _ = ClassStudent.objects.get_or_create(
            classroom=classroom,
            student_code=student_code,
            defaults={"name": student_name},
        )
        if student.name != student_name:
            student.name = student_name
            student.save(update_fields=["name", "updated_at"])
        return response.Response(ClassStudentSerializer(student).data)

    @decorators.action(detail=True, methods=["get", "post"])
    def students(self, request, slug=None):
        classroom = self.get_object()
        if request.method == "GET":
            students = classroom.students.order_by("name", "-created_at")
            return response.Response(ClassStudentSerializer(students, many=True).data)

        denied = require_manage_code(request, classroom.manage_code)
        if denied:
            return denied
        serializer = ClassStudentSerializer(data={**request.data, "classroom": classroom.id})
        serializer.is_valid(raise_exception=True)
        student = serializer.save(classroom=classroom)
        return response.Response(ClassStudentSerializer(student).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["get", "post"])
    def assignments(self, request, slug=None):
        classroom = self.get_object()
        if request.method == "GET":
            assignments = ASSIGNMENTS_WITH_COUNTS.filter(classroom=classroom).order_by("-created_at")
            return response.Response(ClassTestAssignmentSerializer(assignments, many=True).data)

        denied = require_manage_code(request, classroom.manage_code)
        if denied:
            return denied
        serializer = ClassTestAssignmentSerializer(data={**request.data, "classroom": classroom.id})
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save(classroom=classroom)
        return response.Response(ClassTestAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"], url_path="assignments/bulk")
    def bulk_assignments(self, request, slug=None):
        classroom = self.get_object()
        denied = require_manage_code(request, classroom.manage_code)
        if denied:
            return denied
        rows = request.data.get("assignments", [])
        if not isinstance(rows, list):
            return response.Response({"assignments": "Expected a list."}, status=status.HTTP_400_BAD_REQUEST)
        test_slugs = {str(row.get("test_slug", "")).strip() for row in rows if isinstance(row, dict) and str(row.get("test_slug", "")).strip()}
        test_ids = {
            parsed_id
            for row in rows
            if isinstance(row, dict)
            for parsed_id in [positive_id(row.get("test"))]
            if parsed_id
        }
        test_filter = Q(slug__in=test_slugs)
        if test_ids:
            test_filter |= Q(id__in=test_ids)
        tests = Test.objects.filter(test_filter).only("id", "slug", "title")
        tests_by_slug = {test.slug: test for test in tests}
        tests_by_id = {str(test.id): test for test in tests}
        created = []
        skipped = []
        for row in rows:
            if not isinstance(row, dict):
                skipped.append({"reason": "Assignment row must be an object."})
                continue
            test_slug = str(row.get("test_slug", "")).strip()
            test_id = positive_id(row.get("test"))
            test = tests_by_slug.get(test_slug) if test_slug else tests_by_id.get(str(test_id)) if test_id else None
            if not test:
                skipped.append({"test_slug": test_slug, "reason": "Test not found."})
                continue
            serializer = ClassTestAssignmentSerializer(
                data={
                    "classroom": classroom.id,
                    "test": test.id,
                    "title": row.get("title") or test.title,
                    "is_active": row.get("is_active", True),
                    "mode": row.get("mode", ClassTestAssignment.Mode.SESSION),
                    "opens_at": row.get("opens_at"),
                    "closes_at": row.get("closes_at"),
                    "due_at": row.get("due_at"),
                    "attempt_limit": row.get("attempt_limit", 1),
                    "show_answers_after_deadline": row.get("show_answers_after_deadline", False),
                    "allow_late_submission": row.get("allow_late_submission", False),
                    "grading_policy": row.get("grading_policy", ClassTestAssignment.GradingPolicy.BEST),
                }
            )
            serializer.is_valid(raise_exception=True)
            created.append(serializer.save(classroom=classroom))
        created_ids = [assignment.id for assignment in created]
        created_by_id = {assignment.id: assignment for assignment in ASSIGNMENTS_WITH_COUNTS.filter(id__in=created_ids)}
        created = [created_by_id[assignment.id] for assignment in created if assignment.id in created_by_id]
        return response.Response(
            {
                "created": ClassTestAssignmentSerializer(created, many=True).data,
                "skipped": skipped,
            },
            status=status.HTTP_201_CREATED,
        )

    @decorators.action(detail=True, methods=["get", "patch", "delete"], url_path=r"assignments/(?P<assignment_id>[^/.]+)")
    def assignment_detail(self, request, slug=None, assignment_id=None):
        classroom = self.get_object()
        assignment = ASSIGNMENTS_WITH_COUNTS.get(id=assignment_id, classroom=classroom)
        if request.method == "GET":
            return response.Response(ClassTestAssignmentSerializer(assignment).data)

        denied = require_manage_code(request, classroom.manage_code)
        if denied:
            return denied
        if request.method == "DELETE":
            if assignment.sessions.exists():
                assignment.is_active = False
                assignment.save(update_fields=["is_active", "updated_at"])
                return response.Response(ClassTestAssignmentSerializer(assignment).data)
            assignment.delete()
            return response.Response(status=status.HTTP_204_NO_CONTENT)

        serializer = ClassTestAssignmentSerializer(assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save(classroom=classroom)
        return response.Response(ClassTestAssignmentSerializer(assignment).data)

    @decorators.action(detail=True, methods=["post"], url_path=r"assignments/(?P<assignment_id>[^/.]+)/start")
    def start_assignment(self, request, slug=None, assignment_id=None):
        classroom = self.get_object()
        assignment = ClassTestAssignment.objects.select_related("test").get(id=assignment_id, classroom=classroom)
        if not assignment.is_active:
            return response.Response({"detail": "Assignment is not active."}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        if assignment.opens_at and assignment.opens_at > now:
            return response.Response({"detail": "Assignment is not open yet."}, status=status.HTTP_400_BAD_REQUEST)
        if assignment.closes_at and assignment.closes_at < now:
            return response.Response({"detail": "Assignment is closed."}, status=status.HTTP_400_BAD_REQUEST)
        if assignment.test.status != Test.PublishStatus.PUBLISHED:
            return response.Response({"detail": "Only published tests can be started."}, status=status.HTTP_400_BAD_REQUEST)
        student_name = request.data.get("student_name", "").strip()
        join_code = request.data.get("join_code", "")
        if classroom.visibility == TeacherClass.Visibility.PRIVATE and join_code != classroom.join_code:
            return response.Response({"detail": "Invalid join code."}, status=status.HTTP_403_FORBIDDEN)
        if not student_name:
            return response.Response({"student_name": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        student_code = request.data.get("student_code", "").strip()
        if not student_code:
            return response.Response({"student_code": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if assignment.mode == ClassTestAssignment.Mode.HOMEWORK:
            if assignment.due_at and assignment.due_at < now and not assignment.allow_late_submission:
                return response.Response({"detail": "Homework deadline has passed."}, status=status.HTTP_400_BAD_REQUEST)
            previous_attempts = TestSession.objects.filter(assignment=assignment, student_code=student_code).count()
            if previous_attempts >= assignment.attempt_limit:
                return response.Response({"detail": "Attempt limit reached."}, status=status.HTTP_400_BAD_REQUEST)
        ClassStudent.objects.update_or_create(
            classroom=classroom,
            student_code=student_code,
            defaults={"name": student_name},
        )
        session = TestSession.objects.create(
            test=assignment.test,
            classroom=classroom,
            assignment=assignment,
            student_name=student_name,
            student_code=student_code,
            user=request.user if request.user.is_authenticated else None,
        )
        return response.Response(TestSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["get"])
    def results(self, request, slug=None):
        classroom = self.get_object()
        return response.Response(class_results_payload(classroom))


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.prefetch_related("teachers__classes").all().order_by("-created_at")
    serializer_class = SchoolSerializer
    lookup_field = "slug"

    def update(self, request, *args, **kwargs):
        school = self.get_object()
        denied = require_manage_code(request, school.manage_code)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        school = self.get_object()
        denied = require_manage_code(request, school.manage_code)
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=True, methods=["get", "post"])
    def teachers(self, request, slug=None):
        school = self.get_object()
        if request.method == "GET":
            teachers = school.teachers.prefetch_related("classes").order_by("-created_at")
            return response.Response(SchoolTeacherSerializer(teachers, many=True).data)

        denied = require_manage_code(request, school.manage_code)
        if denied:
            return denied
        serializer = SchoolTeacherSerializer(data={**request.data, "school": school.id})
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save(school=school)
        class_ids = request.data.get("classes", [])
        if isinstance(class_ids, list):
            teacher.classes.set(TeacherClass.objects.filter(id__in=class_ids))
        return response.Response(SchoolTeacherSerializer(teacher).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["get", "patch", "delete"], url_path=r"teachers/(?P<teacher_id>[^/.]+)")
    def teacher_detail(self, request, slug=None, teacher_id=None):
        school = self.get_object()
        teacher = SchoolTeacher.objects.prefetch_related("classes").get(id=teacher_id, school=school)
        if request.method == "GET":
            return response.Response(SchoolTeacherSerializer(teacher).data)

        denied = require_manage_code(request, school.manage_code)
        if denied:
            return denied
        if request.method == "DELETE":
            teacher.is_active = False
            teacher.save(update_fields=["is_active", "updated_at"])
            return response.Response(SchoolTeacherSerializer(teacher).data)
        serializer = SchoolTeacherSerializer(teacher, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save(school=school)
        class_ids = request.data.get("classes")
        if isinstance(class_ids, list):
            teacher.classes.set(TeacherClass.objects.filter(id__in=class_ids))
        return response.Response(SchoolTeacherSerializer(teacher).data)

    @decorators.action(detail=True, methods=["get", "post"])
    def classes(self, request, slug=None):
        school = self.get_object()
        if request.method == "GET":
            class_ids = school.teachers.filter(is_active=True).values_list("classes", flat=True)
            classes = TeacherClass.objects.filter(id__in=class_ids).prefetch_related(Prefetch("assignments", queryset=ASSIGNMENTS_WITH_COUNTS), "students").order_by("-created_at")
            return response.Response(TeacherClassSerializer(classes, many=True).data)

        denied = require_manage_code(request, school.manage_code)
        if denied:
            return denied
        teacher_id = request.data.get("teacher_id")
        teacher = SchoolTeacher.objects.filter(id=teacher_id, school=school).first() if teacher_id else school.teachers.filter(is_active=True).first()
        if not teacher:
            return response.Response({"teacher_id": "Active school teacher is required."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = TeacherClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        classroom = serializer.save()
        teacher.classes.add(classroom)
        return response.Response(TeacherClassSerializer(classroom).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["get"])
    def students(self, request, slug=None):
        school = self.get_object()
        class_ids = school.teachers.filter(is_active=True).values_list("classes", flat=True)
        students = ClassStudent.objects.filter(classroom_id__in=class_ids).select_related("classroom").order_by("name", "-created_at")
        return response.Response(ClassStudentSerializer(students, many=True).data)

    @decorators.action(detail=True, methods=["get"])
    def analytics(self, request, slug=None):
        school = self.get_object()
        teachers = school.teachers.prefetch_related("classes").filter(is_active=True)
        teacher_rows = []
        class_rows = []
        student_codes = set()
        total_attempts = 0
        score_sum = 0
        weak_skill_totals = {}

        for teacher in teachers:
            teacher_attempts = 0
            teacher_score_sum = 0
            teacher_students = set()
            for classroom in teacher.classes.all():
                payload = class_results_payload(classroom)
                class_rows.append(
                    {
                        "class_id": classroom.id,
                        "class_slug": classroom.slug,
                        "class_name": classroom.name,
                        "teacher_id": teacher.id,
                        "teacher_name": teacher.name,
                        "attempts": payload["attempts"],
                        "students_submitted": payload["students_submitted"],
                        "sessions_total": payload["sessions_total"],
                        "average_score": payload["average_score"],
                    }
                )
                teacher_attempts += payload["attempts"]
                teacher_score_sum += payload["average_score"] * payload["attempts"]
                for student in payload["student_progress"]:
                    teacher_students.add(student["student_code"])
                    student_codes.add(student["student_code"])
                for skill in payload["weak_skills"]:
                    data = weak_skill_totals.setdefault(skill["skill"], {"skill": skill["skill"], "correct": 0, "total": 0})
                    data["correct"] += skill["correct"]
                    data["total"] += skill["total"]
            total_attempts += teacher_attempts
            score_sum += teacher_score_sum
            teacher_rows.append(
                {
                    "teacher_id": teacher.id,
                    "teacher_name": teacher.name,
                    "email": teacher.email,
                    "class_count": teacher.classes.count(),
                    "attempts": teacher_attempts,
                    "students_submitted": len(teacher_students),
                    "average_score": round(teacher_score_sum / teacher_attempts) if teacher_attempts else 0,
                    "is_active": teacher.is_active,
                }
            )

        weak_skills = [
            {**item, "percent": round((item["correct"] / item["total"]) * 100) if item["total"] else 0}
            for item in weak_skill_totals.values()
        ]
        weak_skills.sort(key=lambda item: item["percent"])

        return response.Response(
            {
                "school": SchoolSerializer(school).data,
                "portal_url": school.portal_domain or (f"https://{school.portal_subdomain}.yourplatform.com" if school.portal_subdomain else ""),
                "teacher_count": teachers.count(),
                "class_count": len(class_rows),
                "students_submitted": len(student_codes),
                "attempts": total_attempts,
                "average_score": round(score_sum / total_attempts) if total_attempts else 0,
                "teachers": teacher_rows,
                "classes": class_rows,
                "weak_skills": weak_skills[:8],
            }
        )


class ExamPackViewSet(viewsets.ModelViewSet):
    queryset = ExamPack.objects.prefetch_related(Prefetch("items", queryset=PACK_ITEMS_WITH_COUNTS)).all().order_by("-created_at")
    serializer_class = ExamPackSerializer
    lookup_field = "slug"

    def list(self, request, *args, **kwargs):
        cleanup_empty_exam_packs()
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if exam_pack_title_exists(request.data.get("title")):
            return import_error("backend_schema", "pack_title_duplicate", "A pack with this title already exists. Rename the pack before saving.", "title")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        pack = self.get_object()
        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        next_title = request.data.get("title", pack.title)
        if exam_pack_title_exists(next_title, exclude_id=pack.id):
            return import_error("backend_schema", "pack_title_duplicate", "A pack with this title already exists. Rename the pack before saving.", "title")
        serializer = self.get_serializer(pack, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        pack = self.get_object()
        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        if pack.sessions.exists():
            pack.is_active = False
            pack.save(update_fields=["is_active", "updated_at"])
            return response.Response(ExamPackSerializer(pack).data)
        pack.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=True, methods=["get", "post"])
    def items(self, request, slug=None):
        pack = self.get_object()
        if request.method == "GET":
            items = PACK_ITEMS_WITH_COUNTS.filter(pack=pack).order_by("order", "id")
            return response.Response(ExamPackItemSerializer(items, many=True).data)

        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        serializer = ExamPackItemSerializer(data={**request.data, "pack": pack.id})
        serializer.is_valid(raise_exception=True)
        item = serializer.save(pack=pack)
        return response.Response(ExamPackItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"], url_path="items/bulk")
    def bulk_items(self, request, slug=None):
        pack = self.get_object()
        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        rows = request.data.get("items", [])
        if not isinstance(rows, list):
            return import_error("backend_schema", "items_not_list", "Expected items to be a list.", "items")
        created = []
        skipped = []
        test_slugs = {
            str(row.get("test_slug", "")).strip()
            for row in rows
            if isinstance(row, dict) and str(row.get("test_slug", "")).strip()
        }
        test_ids = {
            parsed_id
            for row in rows
            if isinstance(row, dict)
            for parsed_id in [positive_id(row.get("test"))]
            if parsed_id
        }
        test_filter = Q(slug__in=test_slugs)
        if test_ids:
            test_filter |= Q(id__in=test_ids)
        tests = Test.objects.filter(test_filter).only("id", "slug", "title")
        tests_by_slug = {test.slug: test for test in tests}
        tests_by_id = {str(test.id): test for test in tests}
        seen_test_ids = set(pack.items.values_list("test_id", flat=True))
        for index, row in enumerate(rows, start=1):
            if not isinstance(row, dict):
                skipped.append({
                    "test_slug": "",
                    "layer": "backend_schema",
                    "code": "item_not_object",
                    "reason": "Item row must be an object.",
                    "field": f"items[{index - 1}]",
                })
                continue
            test_slug = str(row.get("test_slug", "")).strip()
            test_id = positive_id(row.get("test"))
            test = tests_by_slug.get(test_slug) if test_slug else tests_by_id.get(str(test_id)) if test_id else None
            if not test:
                skipped.append({
                    "test_slug": test_slug,
                    "layer": "backend_db",
                    "code": "test_not_found",
                    "reason": "Test not found.",
                    "field": f"items[{index - 1}].test_slug" if test_slug else f"items[{index - 1}].test",
                })
                continue
            if test.id in seen_test_ids:
                skipped.append({
                    "test_slug": test.slug,
                    "layer": "backend_db",
                    "code": "duplicate_pack_item",
                    "reason": "Test is already in this pack.",
                    "field": f"items[{index - 1}]",
                })
                continue
            serializer = ExamPackItemSerializer(
                data={
                    "pack": pack.id,
                    "test": test.id,
                    "title": row.get("title") or test.title,
                    "order": row.get("order", index),
                    "is_required": row.get("is_required", True),
                }
            )
            if not serializer.is_valid():
                skipped.append({
                    "test_slug": test.slug,
                    "layer": "backend_schema",
                    "code": "item_validation_failed",
                    "reason": str(serializer.errors),
                    "field": f"items[{index - 1}]",
                })
                continue
            try:
                created.append(serializer.save(pack=pack))
                seen_test_ids.add(test.id)
            except Exception as exc:
                skipped.append({
                    "test_slug": test.slug,
                    "layer": "backend_db",
                    "code": "item_save_failed",
                    "reason": str(exc),
                    "field": f"items[{index - 1}]",
                })
        if not created and not pack.items.exists():
            pack.delete()
            return response.Response(
                {
                    "created": [],
                    "skipped": skipped,
                    "detail": "No tests were added. Empty pack was not saved.",
                    "layer": "backend_db",
                    "code": "no_items_created",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        created_ids = [item.id for item in created]
        created_by_id = {item.id: item for item in PACK_ITEMS_WITH_COUNTS.filter(id__in=created_ids)}
        created = [created_by_id[item.id] for item in created if item.id in created_by_id]
        return response.Response(
            {"created": ExamPackItemSerializer(created, many=True).data, "skipped": skipped},
            status=status.HTTP_201_CREATED,
        )

    @decorators.action(detail=True, methods=["post"], url_path="items/import-tests")
    @transaction.atomic
    def import_tests(self, request, slug=None):
        pack = self.get_object()
        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        data = request.data.get("source", request.data)
        if not isinstance(data, dict):
            return import_error("backend_schema", "source_not_object", "Expected a JSON object.", "source")
        if data.get("version") != "1.0":
            return import_error("backend_schema", "unsupported_version", "Only version 1.0 is supported.", "version")
        pack_data = data.get("pack") if isinstance(data.get("pack"), dict) else {}
        tests_data = data.get("tests")
        if not isinstance(tests_data, list) or not tests_data:
            return import_error("backend_schema", "tests_missing", "At least one test is required.", "tests")

        subject_slug = slugify(pack_data.get("subject") or pack.exam_type.split(":")[0] or "math")
        subject, _ = Subject.objects.get_or_create(
            slug=subject_slug,
            defaults={"title": str(pack_data.get("subject") or subject_slug).replace("-", " ").title()},
        )
        creator_code = request.data.get("creator_code", "")
        manage_key = request.data.get("manage_key") or creator_code or pack.manage_code
        created_tests = []
        created_items = []
        skipped = []
        start_order = pack.items.count() + 1

        for order, test_data in enumerate(tests_data, start=1):
            test_title = test_data.get("title", f"Test {order}") if isinstance(test_data, dict) else f"Test {order}"
            if not isinstance(test_data, dict):
                skipped.append(import_skip(test_title, "backend_schema", "test_not_object", "Test row must be an object.", f"tests[{order - 1}]"))
                continue
            raw_questions = normalize_import_questions(test_data)
            valid_questions = [
                question for question in raw_questions
                if first_text(question, ["body", "prompt", "question", "text", "savol", "matn"])
            ]
            if not raw_questions:
                skipped.append(import_skip(test_title, "backend_schema", "questions_missing", "Test has no questions array.", f"tests[{order - 1}].questions"))
                continue
            if not valid_questions:
                skipped.append(import_skip(test_title, "backend_schema", "question_prompt_missing", "All questions are missing prompt/body text.", f"tests[{order - 1}].questions"))
                continue
            try:
                topic_slug = slugify(test_data.get("topic") or pack_data.get("branch") or test_data.get("title") or f"topic-{order}")
                topic, _ = Topic.objects.get_or_create(
                    subject=subject,
                    slug=topic_slug,
                    defaults={
                        "title": str(test_data.get("topic") or topic_slug).replace("-", " ").title(),
                        "description": pack_data.get("branch", ""),
                    },
                )
                difficulty = normalize_test_difficulty(test_data.get("difficulty"))
                test = Test.objects.create(
                    title=test_data.get("title") or f"Imported test {order}",
                    slug=unique_slug(Test, test_data.get("title") or f"imported-test-{order}"),
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    estimated_minutes=positive_int(
                        test_data.get("time_limit_minutes")
                        or test_data.get("estimated_minutes")
                        or test_data.get("estimatedMinutes")
                        or test_data.get("minutes"),
                        10,
                    ),
                    passing_score=70,
                    status=Test.PublishStatus.PUBLISHED,
                    creator_name=request.data.get("creator_name") or "Importer",
                    creator_code=creator_code,
                    manage_key=manage_key,
                )
                created_question_count = 0
                for question_order, question_data in enumerate(valid_questions, start=1):
                    skill_ids = []
                    for skill_slug_raw in string_list(
                        question_data.get("skills") or question_data.get("skill") or question_data.get("tags") or question_data.get("konikmalar"),
                        ["general"],
                    ):
                        skill_slug = slugify(skill_slug_raw)
                        skill, _ = Skill.objects.get_or_create(
                            topic=topic,
                            slug=skill_slug or "general",
                            defaults={"title": str(skill_slug_raw).replace("-", " ").title()},
                        )
                        skill_ids.append(skill.id)
                    if not skill_ids:
                        skill, _ = Skill.objects.get_or_create(topic=topic, slug="general", defaults={"title": "General"})
                        skill_ids.append(skill.id)
                    options = normalize_import_options(question_data.get("options") or question_data.get("choices") or question_data.get("answers") or question_data.get("variantlar"))
                    option_texts = [option["text"] for option in options]
                    answer_data = question_data.get("answer") or question_data.get("javob")
                    correct_id = first_text(answer_data, ["correct", "id", "value", "text"]) if isinstance(answer_data, dict) else (
                        question_data.get("correct")
                        or question_data.get("correct_answer")
                        or question_data.get("correctAnswer")
                        or question_data.get("answer_key")
                        or question_data.get("answerKey")
                        or question_data.get("togri_javob")
                        or question_data.get("to'g'ri_javob")
                        or answer_data
                    )
                    answer_text = next((option["text"] for option in options if str(option["id"]) == str(correct_id)), str(correct_id or ""))
                    question = Question.objects.create(
                        subject=subject,
                        topic=topic,
                        type=normalize_question_type(question_data.get("type")),
                        difficulty=normalize_test_difficulty(question_data.get("difficulty") or test_data.get("difficulty")),
                        prompt=first_text(question_data, ["body", "prompt", "question", "text", "savol", "matn"]),
                        options=option_texts,
                        answer=answer_text,
                        explanation=first_text(question_data, ["explanation", "solution", "commentary", "yechim", "izoh"]),
                    )
                    question.skills.set(Skill.objects.filter(id__in=skill_ids, topic=topic))
                    TestQuestion.objects.create(test=test, question=question, order=question_order)
                    created_question_count += 1
                if created_question_count < 1:
                    test.delete()
                    skipped.append(import_skip(test.title, "backend_db", "questions_not_created", "No valid questions were saved.", f"tests[{order - 1}].questions"))
                    continue
                item = ExamPackItem.objects.create(pack=pack, test=test, title=test.title, order=start_order + len(created_items), is_required=True)
                created_tests.append(test)
                created_items.append(item)
            except Exception as exc:
                skipped.append(import_skip(test_title, "backend_db", "test_save_failed", str(exc), f"tests[{order - 1}]"))

        if not created_tests:
            return response.Response(
                {
                    "created": [],
                    "tests": [],
                    "skipped": skipped,
                    "detail": "No tests were imported into this pack.",
                    "layer": "backend_db",
                    "code": "no_tests_imported",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return response.Response(
            {
                "created": ExamPackItemSerializer(created_items, many=True).data,
                "tests": TestSerializer(created_tests, many=True).data,
                "skipped": skipped,
            },
            status=status.HTTP_201_CREATED,
        )

    @decorators.action(detail=True, methods=["get", "patch", "delete"], url_path=r"items/(?P<item_id>[^/.]+)")
    def item_detail(self, request, slug=None, item_id=None):
        pack = self.get_object()
        item = PACK_ITEMS_WITH_COUNTS.get(id=item_id, pack=pack)
        if request.method == "GET":
            return response.Response(ExamPackItemSerializer(item).data)
        denied = require_manage_code(request, pack.manage_code)
        if denied:
            return denied
        if request.method == "DELETE":
            if item.sessions.exists():
                item.is_required = False
                item.save(update_fields=["is_required", "updated_at"])
                return response.Response(ExamPackItemSerializer(item).data)
            item.delete()
            if not pack.items.exists():
                pack.delete()
            return response.Response(status=status.HTTP_204_NO_CONTENT)
        serializer = ExamPackItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(pack=pack)
        return response.Response(ExamPackItemSerializer(item).data)

    @decorators.action(detail=True, methods=["post"], url_path=r"items/(?P<item_id>[^/.]+)/start")
    def start_item(self, request, slug=None, item_id=None):
        pack = self.get_object()
        item = ExamPackItem.objects.select_related("test").get(id=item_id, pack=pack)
        access_code = request.data.get("access_code", "")
        student_name = request.data.get("student_name", "").strip()
        if not pack.is_active:
            return response.Response({"detail": "Exam pack is not active."}, status=status.HTTP_400_BAD_REQUEST)
        if item.test.status != Test.PublishStatus.PUBLISHED:
            return response.Response({"detail": "Only published tests can be started."}, status=status.HTTP_400_BAD_REQUEST)
        if pack.visibility == ExamPack.Visibility.PRIVATE and access_code != pack.access_code:
            return response.Response({"detail": "Invalid access code."}, status=status.HTTP_403_FORBIDDEN)
        if not student_name:
            return response.Response({"student_name": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        student_code = request.data.get("student_code", "").strip()
        if not student_code:
            return response.Response({"student_code": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        session = TestSession.objects.create(
            test=item.test,
            exam_pack=pack,
            exam_pack_item=item,
            student_name=student_name,
            student_code=student_code,
            user=request.user if request.user.is_authenticated else None,
        )
        return response.Response(TestSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["get"])
    def results(self, request, slug=None):
        pack = self.get_object()
        return response.Response(exam_pack_results_payload(pack))


@decorators.api_view(["GET"])
def profile_summary(request):
    student_code = request.query_params.get("student_code", "").strip()
    sessions = (
        TestSession.objects.filter(status=TestSession.Status.SUBMITTED).select_related("test", "test__topic", "test__subject")
        .prefetch_related("answers", "test__testquestion_set__question")
        .order_by("-created_at")
    )
    if student_code:
        sessions = sessions.filter(student_code=student_code)
    submitted_sessions = list(sessions)

    recent_tests = []
    topic_totals = {}
    weekly_activity = {}
    correct_total = 0
    question_total = 0

    for session in submitted_sessions:
        questions = [item.question for item in session.test.testquestion_set.all()]
        answer_map = {answer.question_id: answer.value.strip() for answer in session.answers.all()}
        correct = sum(1 for question in questions if answer_map.get(question.id, "") == question.answer.strip())
        total = len(questions)
        percent = round((correct / total) * 100) if total else 0
        correct_total += correct
        question_total += total

        topic_slug = session.test.topic.slug
        topic_data = topic_totals.setdefault(
            topic_slug,
            {
                "topic": session.test.topic.title,
                "slug": topic_slug,
                "correct": 0,
                "total": 0,
                "attempts": 0,
            },
        )
        topic_data["correct"] += correct
        topic_data["total"] += total
        topic_data["attempts"] += 1

        day = (session.submitted_at or session.created_at).strftime("%a")
        weekly_activity[day] = weekly_activity.get(day, 0) + total

        recent_tests.append(
            {
                "id": session.id,
                "title": session.test.title,
                "slug": session.test.slug,
                "topic": session.test.topic.title,
                "difficulty": session.test.difficulty,
                "score": percent,
                "correct": correct,
                "total": total,
                "submitted_at": (session.submitted_at or session.created_at).isoformat(),
            }
        )

    attempts = len(submitted_sessions)
    average_score = round((correct_total / question_total) * 100) if question_total else 0
    mastery = max(0, min(100, average_score))
    topic_progress = [
        {
            "topic": item["topic"],
            "slug": item["slug"],
            "value": round((item["correct"] / item["total"]) * 100) if item["total"] else 0,
            "attempts": item["attempts"],
        }
        for item in topic_totals.values()
    ]
    topic_progress.sort(key=lambda item: item["value"])

    ordered_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = [{"day": day, "value": weekly_activity.get(day, 0)} for day in ordered_days]

    weak_topics = [topic for topic in topic_progress if topic["value"] < 70]
    recommendations = [
        {
            "title": f"{topic['topic']} targeted practice",
            "description": f"{topic['topic']} bo'yicha natija {topic['value']}%. Avval xatolarni ko'rib, keyin qayta test ishlang.",
            "href": f"/subjects/mathematics/topics/{topic['slug']}" if topic["slug"] == "algebra" else "/subjects/mathematics",
        }
        for topic in weak_topics[:3]
    ]
    if not recommendations:
        recommendations = [
            {
                "title": "Algebra retake",
                "description": "Natijani mustahkamlash uchun Algebra bo'limida boshqa darajadagi testni ishlang.",
                "href": "/subjects/mathematics/topics/algebra",
            }
        ]

    return response.Response(
        {
            "name": request.user.get_full_name() or request.user.username if request.user.is_authenticated else "QuestLab Learner",
            "level": "Algebra Builder" if mastery < 80 else "Algebra Master",
            "tests_taken": attempts,
            "average_score": average_score,
            "math_mastery": mastery,
            "answered_questions": question_total,
            "correct_answers": correct_total,
            "topic_progress": topic_progress,
            "weekly_activity": weekly,
            "recent_tests": recent_tests[:6],
            "recommendations": recommendations,
        }
    )


@decorators.api_view(["GET"])
def mistakes_summary(request):
    student_code = request.query_params.get("student_code", "").strip()
    sessions = (
        TestSession.objects.filter(status=TestSession.Status.SUBMITTED)
        .select_related("test", "test__topic")
        .prefetch_related("answers", "test__testquestion_set__question__skills")
        .order_by("-submitted_at")
    )
    if student_code:
        sessions = sessions.filter(student_code=student_code)
    mistakes = []
    skill_totals = {}
    for session in sessions:
        answer_map = {answer.question_id: answer.value.strip() for answer in session.answers.all()}
        for item in session.test.testquestion_set.all():
            question = item.question
            user_answer = answer_map.get(question.id, "")
            is_correct = user_answer == question.answer.strip()
            skills = list(question.skills.all())
            for skill in skills:
                data = skill_totals.setdefault(skill.title, {"skill": skill.title, "correct": 0, "total": 0})
                data["correct"] += 1 if is_correct else 0
                data["total"] += 1
            if not is_correct:
                mistakes.append(
                    {
                        "session_id": session.id,
                        "question_id": question.id,
                        "test_title": session.test.title,
                        "topic": session.test.topic.title,
                        "prompt": question.prompt,
                        "user_answer": user_answer,
                        "correct_answer": question.answer,
                        "explanation": question.explanation,
                        "skills": [skill.title for skill in skills],
                    }
                )
    weak_skills = [
        {
            **item,
            "percent": round((item["correct"] / item["total"]) * 100) if item["total"] else 0,
        }
        for item in skill_totals.values()
    ]
    weak_skills.sort(key=lambda item: item["percent"])
    return response.Response({"mistakes": mistakes[:50], "weak_skills": weak_skills[:10]})
