from rest_framework import serializers

from learning.models import ClassTestAssignment, Question
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
