from rest_framework import serializers

from learning.models import ClassTestAssignment, Question, Test
from learning.serializers import ExamPackItemSerializer, ExamPackSerializer, TestSerializer


class StartSessionRequestSerializer(serializers.Serializer):
    student_name = serializers.CharField()
    student_code = serializers.CharField()


class StartClassSessionRequestSerializer(StartSessionRequestSerializer):
    join_code = serializers.CharField(required=False, allow_blank=True)


class StartPackSessionRequestSerializer(StartSessionRequestSerializer):
    access_code = serializers.CharField(required=False, allow_blank=True)


class AnswerRequestSerializer(serializers.Serializer):
    question = serializers.IntegerField()
    value = serializers.CharField(required=False, allow_blank=True)
    is_flagged = serializers.BooleanField(required=False, default=False)


class ClassStudentWriteRequestSerializer(serializers.Serializer):
    name = serializers.CharField()
    student_code = serializers.CharField()
    manage_code = serializers.CharField(required=False, allow_blank=True)


class ClassJoinRequestSerializer(StartClassSessionRequestSerializer):
    pass


class AssignmentWriteRequestSerializer(serializers.Serializer):
    test = serializers.IntegerField(required=False)
    title = serializers.CharField(required=False)
    mode = serializers.ChoiceField(choices=ClassTestAssignment.Mode.choices, required=False)
    opens_at = serializers.DateTimeField(required=False, allow_null=True)
    closes_at = serializers.DateTimeField(required=False, allow_null=True)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    attempt_limit = serializers.IntegerField(required=False, min_value=1)
    show_answers_after_deadline = serializers.BooleanField(required=False)
    allow_late_submission = serializers.BooleanField(required=False)
    grading_policy = serializers.ChoiceField(choices=ClassTestAssignment.GradingPolicy.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    manage_code = serializers.CharField(required=False, allow_blank=True)


class BulkAssignmentsRequestSerializer(serializers.Serializer):
    manage_code = serializers.CharField(required=False, allow_blank=True)
    assignments = serializers.ListField(child=serializers.DictField())


class SchoolTeacherWriteRequestSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    teacher_code = serializers.CharField(required=False, allow_blank=True)
    classes = serializers.ListField(child=serializers.IntegerField(), required=False)
    is_active = serializers.BooleanField(required=False)
    manage_code = serializers.CharField(required=False, allow_blank=True)


class SchoolClassWriteRequestSerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.CharField()
    teacher_name = serializers.CharField()
    visibility = serializers.ChoiceField(choices=("public", "private"))
    join_code = serializers.CharField(required=False, allow_blank=True)
    manage_code = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    teacher_id = serializers.IntegerField(required=False)


class PackItemWriteRequestSerializer(serializers.Serializer):
    test = serializers.IntegerField()
    title = serializers.CharField(required=False)
    order = serializers.IntegerField(required=False, min_value=0)
    is_required = serializers.BooleanField(required=False)
    manage_code = serializers.CharField(required=False, allow_blank=True)


class BulkPackItemsRequestSerializer(serializers.Serializer):
    manage_code = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())


class TestPackImportRequestSerializer(serializers.Serializer):
    source = serializers.JSONField()
    status = serializers.ChoiceField(choices=Test.PublishStatus.choices, required=False, default=Test.PublishStatus.PUBLISHED)
    creator_name = serializers.CharField(required=False, allow_blank=True)
    creator_code = serializers.CharField(required=False, allow_blank=True)
    manage_key = serializers.CharField(required=False, allow_blank=True)
    pack_manage_code = serializers.CharField(required=False, allow_blank=True)
    manage_code = serializers.CharField(required=False, allow_blank=True)


class ImportSkipSerializer(serializers.Serializer):
    title = serializers.CharField(required=False)
    test_slug = serializers.CharField(required=False)
    reason = serializers.CharField()
    layer = serializers.CharField(required=False)
    code = serializers.CharField(required=False)
    field = serializers.CharField(required=False)


class TestPackImportResultSerializer(serializers.Serializer):
    pack = ExamPackSerializer(required=False, allow_null=True)
    created = ExamPackItemSerializer(many=True, required=False)
    tests = TestSerializer(many=True, required=False)
    skipped = ImportSkipSerializer(many=True)
    detail = serializers.CharField(required=False)
    layer = serializers.CharField(required=False)
    code = serializers.CharField(required=False)


class TopicProgressSerializer(serializers.Serializer):
    topic = serializers.CharField()
    slug = serializers.CharField()
    value = serializers.IntegerField()
    attempts = serializers.IntegerField()


class WeeklyActivitySerializer(serializers.Serializer):
    day = serializers.CharField()
    value = serializers.IntegerField()


class RecentTestSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=Question.Difficulty.choices)
    score = serializers.IntegerField()
    correct = serializers.IntegerField()
    total = serializers.IntegerField()
    submitted_at = serializers.DateTimeField()


class RecommendationSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField()
    href = serializers.CharField()


class ProfileSummarySerializer(serializers.Serializer):
    name = serializers.CharField()
    level = serializers.CharField()
    tests_taken = serializers.IntegerField()
    average_score = serializers.IntegerField()
    math_mastery = serializers.IntegerField()
    answered_questions = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    topic_progress = TopicProgressSerializer(many=True)
    weekly_activity = WeeklyActivitySerializer(many=True)
    recent_tests = RecentTestSerializer(many=True)
    recommendations = RecommendationSerializer(many=True)


class MasteryStudentSerializer(serializers.Serializer):
    name = serializers.CharField()
    student_code = serializers.CharField()


class MasteryOverviewSerializer(serializers.Serializer):
    mastery = serializers.IntegerField()
    accuracy = serializers.IntegerField()
    tests_taken = serializers.IntegerField()
    questions_attempted = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    weak_skill_count = serializers.IntegerField()


class MasteryTopicSerializer(serializers.Serializer):
    subject = serializers.CharField()
    topic = serializers.CharField()
    topic_slug = serializers.CharField()
    attempts = serializers.IntegerField()
    test_attempts = serializers.IntegerField()
    correct = serializers.IntegerField()
    wrong = serializers.IntegerField()
    accuracy = serializers.IntegerField()
    mastery = serializers.IntegerField()
    confidence = serializers.ChoiceField(choices=("low", "medium", "high"))
    status = serializers.CharField()
    priority_score = serializers.IntegerField()
    is_fundamental = serializers.BooleanField()
    prerequisites = serializers.ListField(child=serializers.CharField())
    last_practiced_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField()


class MasterySkillSerializer(MasteryTopicSerializer):
    skill = serializers.CharField()
    skill_slug = serializers.CharField()


class MasteryRecommendationSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=("review", "practice", "retest", "next_assigned"))
    title = serializers.CharField()
    description = serializers.CharField()
    reason = serializers.CharField()
    href = serializers.CharField()
    priority = serializers.ChoiceField(choices=("low", "medium", "high"))
    topic = serializers.CharField()
    topic_slug = serializers.CharField()
    skill = serializers.CharField()
    skill_slug = serializers.CharField()
    mastery = serializers.IntegerField()


class MasteryProgressSerializer(serializers.Serializer):
    scoring_version = serializers.IntegerField()
    student = MasteryStudentSerializer()
    overview = MasteryOverviewSerializer()
    topics = MasteryTopicSerializer(many=True)
    skills = MasterySkillSerializer(many=True)
    recommendations = MasteryRecommendationSerializer(many=True)
    updated_at = serializers.DateTimeField()


class WeakSkillSerializer(serializers.Serializer):
    skill = serializers.CharField()
    correct = serializers.IntegerField()
    total = serializers.IntegerField()
    percent = serializers.IntegerField()


class MistakeSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    question_id = serializers.IntegerField()
    test_title = serializers.CharField()
    topic = serializers.CharField()
    prompt = serializers.CharField()
    user_answer = serializers.CharField()
    correct_answer = serializers.CharField()
    explanation = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())


class MistakesSummarySerializer(serializers.Serializer):
    mistakes = MistakeSerializer(many=True)
    weak_skills = WeakSkillSerializer(many=True)
