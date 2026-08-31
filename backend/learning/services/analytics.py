from django.db.models import Count, Prefetch, prefetch_related_objects

from learning.models import ClassTestAssignment, ExamPackItem, TestQuestion, TestSession
from learning.serializers import ExamPackSerializer, TeacherClassSerializer
from learning.services.scoring import is_answer_correct, score_session


ANALYTICS_TEST_QUESTIONS = Prefetch(
    "test__testquestion_set",
    queryset=(
        TestQuestion.objects.select_related("question")
        .prefetch_related("question__skills")
        .order_by("order", "id")
    ),
    to_attr="analytics_test_questions",
)
ANALYTICS_ASSIGNMENTS = Prefetch(
    "assignments",
    queryset=ClassTestAssignment.objects.select_related("test").annotate(
        question_count=Count("test__questions", distinct=True),
    ),
)
ANALYTICS_PACK_ITEMS = Prefetch(
    "items",
    queryset=ExamPackItem.objects.select_related("test").annotate(
        question_count=Count("test__questions", distinct=True),
    ),
)


def _student_totals_row(student_totals, session, score):
    student_name = session.student_name or "Student"
    student_code = session.student_code or student_name
    student = student_totals.setdefault(
        student_code,
        {"student_name": student_name, "student_code": student_code, "completed": 0, "_score_sum": 0, "last_submitted_at": None},
    )
    student["student_name"] = student_name
    student["completed"] += 1
    student["_score_sum"] += score
    submitted_at = session.submitted_at.isoformat() if session.submitted_at else None
    if submitted_at and (student["last_submitted_at"] is None or submitted_at > student["last_submitted_at"]):
        student["last_submitted_at"] = submitted_at
    return student_name, student_code, submitted_at


def _student_progress(student_totals):
    rows = []
    for student in student_totals.values():
        completed = student["completed"]
        rows.append(
            {
                "student_name": student["student_name"],
                "student_code": student["student_code"],
                "completed": completed,
                "average_score": round(student["_score_sum"] / completed) if completed else 0,
                "last_submitted_at": student["last_submitted_at"],
            }
        )
    return sorted(rows, key=lambda item: item["last_submitted_at"] or "", reverse=True)


def _weak_skills(skill_totals):
    rows = [
        {**item, "percent": round((item["correct"] / item["total"]) * 100) if item["total"] else 0}
        for item in skill_totals.values()
    ]
    return sorted(rows, key=lambda item: item["percent"])


def _add_skill_totals(skill_totals, questions, answer_map):
    for question in questions:
        is_correct = is_answer_correct(question, answer_map.get(question.id, ""))
        for skill in question.skills.all():
            data = skill_totals.setdefault(skill.title, {"skill": skill.title, "correct": 0, "total": 0})
            data["correct"] += int(is_correct)
            data["total"] += 1


def class_results_payload(classroom):
    prefetch_related_objects([classroom], ANALYTICS_ASSIGNMENTS, "students")
    assignments = list(classroom.assignments.all())
    sessions = (
        TestSession.objects.filter(classroom=classroom, status=TestSession.Status.SUBMITTED)
        .select_related("test", "assignment", "exam_pack_item")
        .prefetch_related("answers", ANALYTICS_TEST_QUESTIONS)
        .order_by("-submitted_at")
    )
    rows = []
    skill_totals = {}
    student_totals = {}
    assignment_totals = {}
    score_sum = 0

    for assignment in assignments:
        assignment_totals[assignment.id] = {
            "assignment_id": assignment.id,
            "assignment_title": assignment.title,
            "test_title": assignment.test.title,
            "test_slug": assignment.test.slug,
            "mode": assignment.mode,
            "due_at": assignment.due_at.isoformat() if assignment.due_at else None,
            "attempt_limit": assignment.attempt_limit,
            "show_answers_after_deadline": assignment.show_answers_after_deadline,
            "allow_late_submission": assignment.allow_late_submission,
            "grading_policy": assignment.grading_policy,
            "is_active": assignment.is_active,
            "attempts": 0,
            "late_submissions": 0,
            "_score_sum": 0,
            "_students": set(),
        }

    for session in sessions:
        questions, answer_map, correct, total, score = score_session(session)
        score_sum += score
        student_name, student_code, submitted_at = _student_totals_row(student_totals, session, score)
        assignment = session.assignment
        if session.assignment_id:
            assignment_data = assignment_totals.setdefault(
                session.assignment_id,
                {
                    "assignment_id": session.assignment_id,
                    "assignment_title": assignment.title if assignment else "",
                    "test_title": session.test.title,
                    "test_slug": session.test.slug,
                    "mode": assignment.mode if assignment else ClassTestAssignment.Mode.SESSION,
                    "due_at": assignment.due_at.isoformat() if assignment and assignment.due_at else None,
                    "attempt_limit": assignment.attempt_limit if assignment else 1,
                    "show_answers_after_deadline": assignment.show_answers_after_deadline if assignment else False,
                    "allow_late_submission": assignment.allow_late_submission if assignment else False,
                    "grading_policy": assignment.grading_policy if assignment else ClassTestAssignment.GradingPolicy.BEST,
                    "is_active": assignment.is_active if assignment else False,
                    "attempts": 0,
                    "late_submissions": 0,
                    "_score_sum": 0,
                    "_students": set(),
                },
            )
            assignment_data["attempts"] += 1
            assignment_data["_score_sum"] += score
            assignment_data["_students"].add(student_code)
            if assignment and assignment.due_at and session.submitted_at and session.submitted_at > assignment.due_at:
                assignment_data["late_submissions"] += 1

        _add_skill_totals(skill_totals, questions, answer_map)
        rows.append(
            {
                "session_id": session.id,
                "student_name": student_name,
                "student_code": student_code,
                "test_title": session.test.title,
                "test_slug": session.test.slug,
                "assignment_id": session.assignment_id,
                "assignment_title": assignment.title if assignment else "",
                "assignment_mode": assignment.mode if assignment else None,
                "score": score,
                "correct": correct,
                "total": total,
                "submitted_at": submitted_at,
                "is_late": bool(assignment and assignment.due_at and session.submitted_at and session.submitted_at > assignment.due_at),
            }
        )

    assignment_stats = []
    for item in assignment_totals.values():
        attempts = item["attempts"]
        assignment_stats.append(
            {
                "assignment_id": item["assignment_id"],
                "assignment_title": item["assignment_title"],
                "test_title": item["test_title"],
                "test_slug": item["test_slug"],
                "mode": item["mode"],
                "due_at": item["due_at"],
                "attempt_limit": item["attempt_limit"],
                "show_answers_after_deadline": item["show_answers_after_deadline"],
                "allow_late_submission": item["allow_late_submission"],
                "grading_policy": item["grading_policy"],
                "is_active": item["is_active"],
                "attempts": attempts,
                "unique_students": len(item["_students"]),
                "late_submissions": item["late_submissions"],
                "average_score": round(item["_score_sum"] / attempts) if attempts else 0,
            }
        )

    count = len(rows)
    return {
        "classroom": TeacherClassSerializer(classroom).data,
        "attempts": count,
        "average_score": round(score_sum / count) if count else 0,
        "students_total": len(classroom.students.all()),
        "students_submitted": len(student_totals),
        "sessions_total": len(assignments),
        "sessions_open": sum(1 for assignment in assignments if assignment.is_active),
        "results": rows,
        "weak_skills": _weak_skills(skill_totals)[:6],
        "assignment_stats": assignment_stats,
        "student_progress": _student_progress(student_totals),
    }


def exam_pack_results_payload(pack):
    prefetch_related_objects([pack], ANALYTICS_PACK_ITEMS)
    pack_items = list(pack.items.all())
    sessions = (
        TestSession.objects.filter(exam_pack=pack, status=TestSession.Status.SUBMITTED)
        .select_related("test", "exam_pack_item")
        .prefetch_related("answers", ANALYTICS_TEST_QUESTIONS)
        .order_by("-submitted_at")
    )
    rows = []
    item_totals = {}
    student_totals = {}
    skill_totals = {}
    score_sum = 0

    for item in pack_items:
        item_totals[item.id] = {
            "item_id": item.id,
            "item_title": item.title,
            "test_title": item.test.title,
            "test_slug": item.test.slug,
            "is_required": item.is_required,
            "attempts": 0,
            "_score_sum": 0,
            "_students": set(),
        }

    for session in sessions:
        questions, answer_map, correct, total, score = score_session(session)
        score_sum += score
        student_name, student_code, submitted_at = _student_totals_row(student_totals, session, score)
        item = session.exam_pack_item
        if session.exam_pack_item_id:
            item_data = item_totals.setdefault(
                session.exam_pack_item_id,
                {
                    "item_id": session.exam_pack_item_id,
                    "item_title": item.title if item else "",
                    "test_title": session.test.title,
                    "test_slug": session.test.slug,
                    "is_required": item.is_required if item else False,
                    "attempts": 0,
                    "_score_sum": 0,
                    "_students": set(),
                },
            )
            item_data["attempts"] += 1
            item_data["_score_sum"] += score
            item_data["_students"].add(student_code)

        _add_skill_totals(skill_totals, questions, answer_map)
        rows.append(
            {
                "session_id": session.id,
                "student_name": student_name,
                "student_code": student_code,
                "test_title": session.test.title,
                "test_slug": session.test.slug,
                "item_id": session.exam_pack_item_id,
                "item_title": item.title if item else "",
                "score": score,
                "correct": correct,
                "total": total,
                "submitted_at": submitted_at,
            }
        )

    item_stats = []
    for item in item_totals.values():
        attempts = item["attempts"]
        item_stats.append(
            {
                "item_id": item["item_id"],
                "item_title": item["item_title"],
                "test_title": item["test_title"],
                "test_slug": item["test_slug"],
                "is_required": item["is_required"],
                "attempts": attempts,
                "unique_students": len(item["_students"]),
                "average_score": round(item["_score_sum"] / attempts) if attempts else 0,
            }
        )

    count = len(rows)
    return {
        "pack": ExamPackSerializer(pack).data,
        "attempts": count,
        "average_score": round(score_sum / count) if count else 0,
        "students_submitted": len(student_totals),
        "items_total": len(pack_items),
        "required_total": sum(1 for item in pack_items if item.is_required),
        "results": rows,
        "item_stats": item_stats,
        "student_progress": _student_progress(student_totals),
        "weak_skills": _weak_skills(skill_totals)[:6],
    }
