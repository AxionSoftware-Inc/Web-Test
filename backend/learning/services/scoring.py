import json
import re

from learning.models import Question, TestSession
from learning.serializers import QuestionSerializer, TestSerializer


SCORING_VERSION = 1


def normalize_answer(value):
    return re.sub(r"\s+", "", str(value or "").casefold().replace("\\cdot", "*").replace("\\", ""))


def _answer_values(value):
    if isinstance(value, (list, tuple, set)):
        return {normalize_answer(item) for item in value if normalize_answer(item)}
    text = str(value or "").strip()
    if not text:
        return set()
    try:
        parsed = json.loads(text)
    except (TypeError, ValueError, json.JSONDecodeError):
        parsed = None
    if isinstance(parsed, list):
        return _answer_values(parsed)
    return {normalize_answer(item) for item in re.split(r"\s*[,;|]\s*", text) if normalize_answer(item)}


def is_answer_correct(question: Question, submitted):
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return _answer_values(submitted) == _answer_values(question.answer)
    return bool(normalize_answer(submitted)) and normalize_answer(submitted) == normalize_answer(question.answer)


def session_question_items(session):
    items = getattr(session.test, "analytics_test_questions", None)
    if items is not None:
        return list(items)
    return list(
        session.test.testquestion_set.select_related("question")
        .prefetch_related("question__skills")
        .order_by("order", "id")
    )


def score_session(session):
    items = session_question_items(session)
    questions = [item.question for item in items]
    answer_map = {answer.question_id: answer.value.strip() for answer in session.answers.all()}
    snapshot_summary = (session.result_snapshot or {}).get("summary") if isinstance(session.result_snapshot, dict) else None
    if session.status == TestSession.Status.SUBMITTED and isinstance(snapshot_summary, dict):
        total = int(snapshot_summary.get("total", len(questions)))
        correct = int(snapshot_summary.get("correct", 0))
        score = int(snapshot_summary.get("score", 0))
        return questions, answer_map, correct, total, score
    correct = sum(int(is_answer_correct(question, answer_map.get(question.id, ""))) for question in questions)
    total = len(questions)
    score = round((correct / total) * 100) if total else 0
    return questions, answer_map, correct, total, score


def build_session_result(session):
    items = session_question_items(session)
    answer_map = {answer.question_id: answer for answer in session.answers.all()}
    question_rows = []
    correct = 0
    for item in items:
        question = item.question
        answer = answer_map.get(question.id)
        submitted = answer.value.strip() if answer else ""
        is_correct = is_answer_correct(question, submitted)
        correct += int(is_correct)
        question_rows.append(
            {
                "order": item.order,
                "question_id": question.id,
                "question": QuestionSerializer(question).data,
                "student_answer": submitted,
                "is_correct": is_correct,
            }
        )
    total = len(question_rows)
    answered = sum(int(bool(row["student_answer"])) for row in question_rows)
    return {
        "session_id": session.id,
        "scoring_version": SCORING_VERSION,
        "test": TestSerializer(session.test).data,
        "summary": {
            "correct": correct,
            "wrong": max(0, answered - correct),
            "skipped": max(0, total - answered),
            "answered": answered,
            "total": total,
            "score": round((correct / total) * 100) if total else 0,
        },
        "questions": question_rows,
    }
