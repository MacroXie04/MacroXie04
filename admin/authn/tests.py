from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthnAPITests(APITestCase):
    def create_user(self, email="user@example.com", password="StrongPass123!", **extra):
        defaults = {
            "first_name": "Test",
            "last_name": "User",
        }
        defaults.update(extra)
        return User.objects.create_user(email=email, password=password, **defaults)

    def authenticate(self, user, password="StrongPass123!"):
        response = self.client.post(
            reverse("authn:token_obtain_pair"),
            {"email": user.email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response.data

    def test_signup_creates_user_and_returns_tokens(self):
        response = self.client.post(
            reverse("authn:signup"),
            {
                "email": "New.User@Example.com",
                "password": "StrongPass123!",
                "first_name": "New",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "new.user@example.com")
        user = User.objects.get(email="new.user@example.com")
        self.assertEqual(user.first_name, "New")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_signup_rejects_duplicate_email_case_insensitive(self):
        self.create_user(email="Existing@Example.com")

        response = self.client.post(
            reverse("authn:signup"),
            {
                "email": "existing@example.com",
                "password": "StrongPass123!",
                "first_name": "Copy",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_signup_rejects_weak_password(self):
        response = self.client.post(
            reverse("authn:signup"),
            {
                "email": "weak@example.com",
                "password": "password",
                "first_name": "Weak",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_token_login_uses_email(self):
        self.create_user(email="login@example.com", password="StrongPass123!")

        response = self.client.post(
            reverse("authn:token_obtain_pair"),
            {"email": "login@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_refresh_returns_new_access_token(self):
        user = self.create_user()
        tokens = self.authenticate(user)
        self.client.credentials()

        response = self.client.post(
            reverse("authn:token_refresh"),
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_blacklists_refresh_token(self):
        user = self.create_user()
        tokens = self.authenticate(user)

        logout_response = self.client.post(
            reverse("authn:logout"),
            {"refresh": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(logout_response.status_code, status.HTTP_204_NO_CONTENT)

        self.client.credentials()
        refresh_response = self.client.post(
            reverse("authn:token_refresh"),
            {"refresh": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("authn:me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_and_updates_current_user(self):
        user = self.create_user(email="me@example.com")
        self.authenticate(user)

        get_response = self.client.get(reverse("authn:me"))
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["email"], "me@example.com")

        patch_response = self.client.patch(
            reverse("authn:me"),
            {"first_name": "Updated", "last_name": "Name"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Updated")
        self.assertEqual(user.last_name, "Name")

    def test_password_change_updates_password(self):
        user = self.create_user(password="OldStrongPass123!")
        self.authenticate(user, password="OldStrongPass123!")

        response = self.client.post(
            reverse("authn:password_change"),
            {
                "old_password": "OldStrongPass123!",
                "new_password": "NewStrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewStrongPass123!"))
