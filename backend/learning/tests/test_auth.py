from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


class AuthTokenTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_user_and_token(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "username": "alisher",
                "password": "securepassword123",
                "email": "alisher@example.com",
                "display_name": "Alisher Navoiy",
                "role": "teacher",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "alisher")
        self.assertEqual(response.data["profile"]["active_role"], "teacher")

        user = User.objects.get(username="alisher")
        token = Token.objects.get(user=user)
        self.assertEqual(response.data["token"], token.key)

    def test_login_returns_valid_token(self):
        user = User.objects.create_user(username="sarvar", password="mypassword123", email="sarvar@example.com")

        # Test login with username
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "sarvar", "password": "mypassword123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        token_key = response.data["token"]

        # Test login with email
        email_response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "sarvar@example.com", "password": "mypassword123"},
            format="json",
        )
        self.assertEqual(email_response.status_code, status.HTTP_200_OK)
        self.assertEqual(email_response.data["token"], token_key)

    def test_auth_me_requires_token(self):
        # Unauthenticated request
        anon_res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(anon_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated request with Bearer/Token header
        user = User.objects.create_user(username="nodira", password="password123")
        token = Token.objects.create(user=user)

        self.client.credentials(HTTP_AUTHORIZATION="Token " + token.key)
        auth_res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(auth_res.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_res.data["user"]["username"], "nodira")

    def test_logout_removes_token(self):
        user = User.objects.create_user(username="botir", password="password123")
        token = Token.objects.create(user=user)

        self.client.credentials(HTTP_AUTHORIZATION="Token " + token.key)
        logout_res = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())
