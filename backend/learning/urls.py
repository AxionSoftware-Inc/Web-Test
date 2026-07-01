from rest_framework.routers import DefaultRouter

from django.urls import path

from learning.views import (
    QuestionViewSet,
    ExamPackViewSet,
    SchoolViewSet,
    SkillViewSet,
    SubjectViewSet,
    TeacherClassViewSet,
    TestSessionViewSet,
    TestViewSet,
    TopicViewSet,
    mistakes_summary,
    google_auth,
    profile_summary,
    role_profile,
    role_profile_search,
)

router = DefaultRouter()
router.register("subjects", SubjectViewSet)
router.register("topics", TopicViewSet)
router.register("skills", SkillViewSet)
router.register("questions", QuestionViewSet)
router.register("tests", TestViewSet)
router.register("sessions", TestSessionViewSet)
router.register("classes", TeacherClassViewSet)
router.register("exam-packs", ExamPackViewSet)
router.register("schools", SchoolViewSet)

urlpatterns = [
    path("profile/summary/", profile_summary),
    path("profile/role/", role_profile),
    path("profile/role-search/", role_profile_search),
    path("auth/google/", google_auth),
    path("mistakes/summary/", mistakes_summary),
    *router.urls,
]
