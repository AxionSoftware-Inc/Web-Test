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
    auth_login,
    auth_logout,
    auth_me,
    auth_register,
    mistakes_summary,
    health_check,
    profile_mastery,
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
    path("health/", health_check),
    path("auth/register/", auth_register, name="auth-register"),
    path("auth/login/", auth_login, name="auth-login"),
    path("auth/me/", auth_me, name="auth-me"),
    path("auth/logout/", auth_logout, name="auth-logout"),
    path("profile/summary/", profile_summary),
    path("profile/mastery/", profile_mastery),
    path("profile/role/", role_profile),
    path("profile/role-search/", role_profile_search),
    path("mistakes/summary/", mistakes_summary),
    *router.urls,
]
