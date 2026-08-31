from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from django.db.models import Prefetch
from django.utils import timezone
from django.utils.text import slugify

from learning.models import StudentProgress, Test, TestQuestion, TestSession
from learning.services.scoring import is_answer_correct, score_session


MASTERY_VERSION = 1
GENERAL_SKILL_TITLE = "General foundations"


def _confidence(attempts: int) -> str:
    if attempts >= 15:
        return "high"
    if attempts >= 6:
        return "medium"
    return "low"


def _status(attempts: int, accuracy: int, confidence: str) -> str:
    if attempts == 0:
        return "not_started"
    if confidence == "low":
        return "learning"
    if accuracy < 50:
        return "weak"
    if accuracy < 70:
        return "needs_practice"
    if accuracy < 85:
        return "good"
    return "mastered"


def _mastery(accuracy: int, confidence: str) -> int:
    # Keep this formula aligned with the frontend engine. Raw accuracy remains
    # visible separately; mastery discounts low-evidence and medium-evidence data.
    multiplier = 0.75 if confidence == "low" else 0.9 if confidence == "medium" else 1
    return round(max(0, min(100, accuracy * multiplier)))


def _priority(*, wrong: int, mastery: int, confidence: str, status: str) -> int:
    score = wrong * 2 + max(0, 70 - mastery)
    if confidence == "high":
        score += 15
    elif confidence == "medium":
        score += 8
    if status == "weak":
        score += 20
    elif status == "needs_practice":
        score += 10
    return round(score)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _snapshot_rows(session: TestSession) -> list[dict] | None:
    snapshot = session.result_snapshot if isinstance(session.result_snapshot, dict) else None
    rows = snapshot.get("questions") if snapshot else None
    return rows if isinstance(rows, list) and rows else None


def _session_evidence(session: TestSession) -> list[dict]:
    """Return one stable evidence row per question in a submitted session."""
    snapshot_rows = _snapshot_rows(session)
    if snapshot_rows:
        evidence = []
        for row in snapshot_rows:
            if not isinstance(row, dict):
                continue
            question = row.get("question") if isinstance(row.get("question"), dict) else {}
            skill_titles = question.get("skill_titles")
            skills = [str(item).strip() for item in skill_titles if str(item).strip()] if isinstance(skill_titles, list) else []
            evidence.append(
                {
                    "question_id": row.get("question_id"),
                    "is_correct": bool(row.get("is_correct")),
                    "skills": skills or [GENERAL_SKILL_TITLE],
                }
            )
        if evidence:
            return evidence

    questions, answer_map, _correct, _total, _score = score_session(session)
    return [
        {
            "question_id": question.id,
            "is_correct": is_answer_correct(question, answer_map.get(question.id, "")),
            "skills": [skill.title for skill in question.skills.all()] or [GENERAL_SKILL_TITLE],
        }
        for question in questions
    ]


def _progress_row(*, subject: str, topic: str, topic_slug: str, attempts: int, correct: int, last_practiced_at: datetime | None, test_attempts: int = 0, skill: str | None = None) -> dict:
    wrong = max(0, attempts - correct)
    accuracy = round((correct / attempts) * 100) if attempts else 0
    confidence = _confidence(attempts)
    mastery = _mastery(accuracy, confidence)
    current_status = _status(attempts, accuracy, confidence)
    result = {
        "subject": subject,
        "topic": topic,
        "topic_slug": topic_slug,
        "attempts": attempts,
        "test_attempts": test_attempts,
        "correct": correct,
        "wrong": wrong,
        "accuracy": accuracy,
        "mastery": mastery,
        "confidence": confidence,
        "status": current_status,
        "priority_score": _priority(wrong=wrong, mastery=mastery, confidence=confidence, status=current_status),
        "is_fundamental": False,
        "prerequisites": [],
        "last_practiced_at": _iso(last_practiced_at),
        "updated_at": _iso(last_practiced_at) or timezone.now().isoformat(),
    }
    if skill is not None:
        result.update({"skill": skill, "skill_slug": slugify(skill) or "general"})
    return result


def _candidate_tests(topic_slugs: set[str]) -> dict[str, list[Test]]:
    if not topic_slugs:
        return {}
    tests = (
        Test.objects.filter(status=Test.PublishStatus.PUBLISHED, topic__slug__in=topic_slugs)
        .select_related("topic")
        .prefetch_related(
            Prefetch(
                "testquestion_set",
                queryset=TestQuestion.objects.select_related("question").prefetch_related("question__skills"),
                to_attr="mastery_test_questions",
            )
        )
        .order_by("created_at", "id")
    )
    grouped: dict[str, list[Test]] = defaultdict(list)
    for test in tests:
        grouped[test.topic.slug].append(test)
    return grouped


def _recommendations(skills: list[dict], topics: list[dict], tests_by_topic: dict[str, list[Test]]) -> list[dict]:
    recommendations = []
    targets = [("skill", item) for item in skills if item["mastery"] < 85][:5]
    if not targets:
        targets = [("topic", item) for item in topics if item["mastery"] < 85][:3]

    for target_type, target in targets:
        candidates = tests_by_topic.get(target["topic_slug"], [])
        target_skill = target.get("skill")
        matching_test = next(
            (
                test
                for test in candidates
                if target_type != "skill"
                or any(
                    skill.title == target_skill
                    for item in getattr(test, "mastery_test_questions", [])
                    for skill in item.question.skills.all()
                )
            ),
            candidates[0] if candidates else None,
        )
        label = target_skill or target["topic"]
        if matching_test:
            action_type = "practice" if target["mastery"] < 50 else "retest"
            title = f"{('Practice' if action_type == 'practice' else 'Retest')} {label}"
            href = f"/student/tests/{matching_test.slug}/start"
        else:
            action_type = "review"
            title = f"Review {label}"
            href = "/student/mistakes"
        recommendations.append(
            {
                "type": action_type,
                "title": title,
                "description": f"{label}: {target['mastery']}% mastery from {target['attempts']} question attempts.",
                "reason": f"{target['accuracy']}% accuracy · {target['confidence']} confidence. Focus here to make the fastest progress.",
                "href": href,
                "priority": "high" if target["priority_score"] >= 70 else "medium" if target["priority_score"] >= 35 else "low",
                "topic": target["topic"],
                "topic_slug": target["topic_slug"],
                "skill": target.get("skill", ""),
                "skill_slug": target.get("skill_slug", ""),
                "mastery": target["mastery"],
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "type": "next_assigned",
                "title": "Start a diagnostic test",
                "description": "Build your first skill map with a short published test.",
                "reason": "No completed evidence is available yet.",
                "href": "/student/tests",
                "priority": "low",
                "topic": "",
                "topic_slug": "",
                "skill": "",
                "skill_slug": "",
                "mastery": 0,
            }
        )
    return recommendations[:5]


def build_mastery_progress(student_code: str) -> dict:
    """Build the learner's knowledge map from every submitted session."""
    sessions = list(
        TestSession.objects.filter(status=TestSession.Status.SUBMITTED, student_code=student_code)
        .select_related("test__topic__subject", "test__subject")
        .prefetch_related(
            "answers",
            Prefetch(
                "test__testquestion_set",
                queryset=TestQuestion.objects.select_related("question").prefetch_related("question__skills").order_by("order", "id"),
                to_attr="analytics_test_questions",
            ),
        )
        .order_by("created_at", "id")
    )
    topic_totals: dict[str, dict] = {}
    skill_totals: dict[str, dict] = {}

    for session in sessions:
        topic = session.test.topic
        subject_title = session.test.subject.title
        practiced_at = session.submitted_at or session.created_at
        topic_key = f"{subject_title}:{topic.slug}"
        topic_row = topic_totals.setdefault(
            topic_key,
            {"subject": subject_title, "topic": topic.title, "topic_slug": topic.slug, "attempts": 0, "correct": 0, "last_practiced_at": None, "test_attempts": 0},
        )
        evidence_rows = _session_evidence(session)
        seen_skills: set[str] = set()
        for evidence in evidence_rows:
            topic_row["attempts"] += 1
            topic_row["correct"] += int(evidence["is_correct"])
            topic_row["last_practiced_at"] = max(topic_row["last_practiced_at"] or practiced_at, practiced_at)
            for skill in evidence["skills"]:
                skill_key = f"{topic_key}:{slugify(skill) or 'general'}"
                skill_row = skill_totals.setdefault(
                    skill_key,
                    {"subject": subject_title, "topic": topic.title, "topic_slug": topic.slug, "skill": skill, "attempts": 0, "correct": 0, "last_practiced_at": None, "test_attempts": 0},
                )
                skill_row["attempts"] += 1
                skill_row["correct"] += int(evidence["is_correct"])
                skill_row["last_practiced_at"] = max(skill_row["last_practiced_at"] or practiced_at, practiced_at)
                seen_skills.add(skill_key)
        topic_row["test_attempts"] += 1
        for skill_key in seen_skills:
            skill_totals[skill_key]["test_attempts"] += 1

    topics = [
        _progress_row(
            subject=row["subject"],
            topic=row["topic"],
            topic_slug=row["topic_slug"],
            attempts=row["attempts"],
            correct=row["correct"],
            last_practiced_at=row["last_practiced_at"],
            test_attempts=row["test_attempts"],
        )
        for row in topic_totals.values()
    ]
    skills = [
        _progress_row(
            subject=row["subject"],
            topic=row["topic"],
            topic_slug=row["topic_slug"],
            skill=row["skill"],
            attempts=row["attempts"],
            correct=row["correct"],
            last_practiced_at=row["last_practiced_at"],
            test_attempts=row["test_attempts"],
        )
        for row in skill_totals.values()
    ]
    topics.sort(key=lambda item: (-item["priority_score"], item["mastery"], item["topic"]))
    skills.sort(key=lambda item: (-item["priority_score"], item["mastery"], item["skill"]))
    tests_by_topic = _candidate_tests({item["topic_slug"] for item in topics})
    recommendations = _recommendations(skills, topics, tests_by_topic)

    questions_attempted = sum(item["attempts"] for item in topics)
    correct_answers = sum(item["correct"] for item in topics)
    overview_mastery = round(sum(item["mastery"] * item["attempts"] for item in topics) / questions_attempted) if questions_attempted else 0
    overview_accuracy = round((correct_answers / questions_attempted) * 100) if questions_attempted else 0
    weak_skills = sum(item["mastery"] < 70 for item in skills)
    name = sessions[-1].student_name if sessions and sessions[-1].student_name else "QuestLab Learner"
    updated_at = max((item["updated_at"] for item in topics + skills), default=timezone.now().isoformat())

    return {
        "scoring_version": MASTERY_VERSION,
        "student": {"name": name, "student_code": student_code},
        "overview": {
            "mastery": overview_mastery,
            "accuracy": overview_accuracy,
            "tests_taken": len(sessions),
            "questions_attempted": questions_attempted,
            "correct_answers": correct_answers,
            "weak_skill_count": weak_skills,
        },
        "topics": topics,
        "skills": skills,
        "recommendations": recommendations,
        "updated_at": updated_at,
    }


def get_mastery_progress(student_code: str) -> dict:
    """Return the materialized map, rebuilding it for a learner seen for the first time."""
    progress = StudentProgress.objects.filter(student_code=student_code).first()
    if progress and isinstance(progress.snapshot, dict) and progress.snapshot.get("scoring_version") == MASTERY_VERSION:
        return progress.snapshot
    return refresh_mastery_progress(student_code)


def refresh_mastery_progress(student_code: str) -> dict:
    snapshot = build_mastery_progress(student_code)
    StudentProgress.objects.update_or_create(student_code=student_code, defaults={"snapshot": snapshot})
    return snapshot
