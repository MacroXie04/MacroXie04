from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from cms.asset_validation import validate_asset_file_size, validate_asset_file_type
from cms.blocks import validate_block_data
from cms.models import CMSBlock, CMSPage, normalize_cms_route, validate_cms_route


User = get_user_model()


class RouteHelperTests(APITestCase):
    def test_normalize_route_canonical_forms(self):
        self.assertEqual(normalize_cms_route("about/"), "/about")
        self.assertEqual(normalize_cms_route("/about"), "/about")
        self.assertEqual(normalize_cms_route(" a / b "), "/a/b")
        self.assertEqual(normalize_cms_route(""), "/")
        self.assertEqual(normalize_cms_route(None), "/")
        self.assertEqual(normalize_cms_route("///"), "/")

    def test_validate_route_accepts_valid_segments(self):
        self.assertEqual(validate_cms_route("/my-page/sub_page2"), "/my-page/sub_page2")
        self.assertEqual(validate_cms_route("/"), "/")

    def test_validate_route_rejects_invalid_segments(self):
        for bad in ["/a b", "/a$", "/-leading", "/trailing-"]:
            with self.assertRaises(ValidationError):
                validate_cms_route(bad)


class BlockValidationTests(APITestCase):
    def test_unknown_block_type_rejected(self):
        with self.assertRaises(ValidationError):
            validate_block_data("sponsor_year", {"year": "2026", "sponsors": []})

    def test_missing_required_field_rejected(self):
        with self.assertRaises(ValidationError):
            validate_block_data("rich_text", {"heading": "No body"})

    def test_link_list_unsafe_url_rejected(self):
        data = {"items": [{"label": "x", "url": "javascript:alert(1)"}]}
        with self.assertRaises(ValidationError):
            validate_block_data("link_list", data)

    def test_valid_blocks_pass(self):
        validate_block_data("hero", {"heading": "Hi"})
        validate_block_data("rich_text", {"body_html": "<p>Hello</p>"})
        validate_block_data("link_list", {"items": [{"label": "GitHub", "url": "https://github.com"}]})
        validate_block_data("table", {"columns": ["A"], "rows": [["1"]]})

    def test_block_clean_runs_validation(self):
        page = CMSPage.objects.create(route="/clean-test", title="Clean Test")
        block = CMSBlock(page=page, block_type="rich_text", data={})
        with self.assertRaises(ValidationError):
            block.full_clean()


class PagePublishTests(APITestCase):
    def test_published_at_stamped_once(self):
        page = CMSPage.objects.create(route="/stamp", title="Stamp", status="draft")
        self.assertIsNone(page.published_at)

        page.status = "published"
        page.save()
        first_stamp = page.published_at
        self.assertIsNotNone(first_stamp)

        page.title = "Stamp 2"
        page.save()
        page.refresh_from_db()
        self.assertEqual(page.published_at, first_stamp)

    def test_save_normalizes_route(self):
        page = CMSPage.objects.create(route="about/", title="About")
        self.assertEqual(page.route, "/about")


class CMSPageAPITests(APITestCase):
    def setUp(self):
        self.page = CMSPage.objects.create(route="/about", title="About", status="published")
        CMSBlock.objects.create(
            page=self.page, block_type="rich_text", sort_order=2, data={"body_html": "<p>Second</p>"}
        )
        CMSBlock.objects.create(page=self.page, block_type="hero", sort_order=1, data={"heading": "First"})

    def authenticate(self, user, password="StrongPass123!"):
        response = self.client.post(
            reverse("authn:token_obtain_pair"),
            {"email": user.email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def page_url(self, route_path):
        if route_path:
            return reverse("cms:cms-page", kwargs={"route_path": route_path})
        return reverse("cms:cms-page-root")

    def test_published_page_returns_ordered_blocks(self):
        response = self.client.get(self.page_url("about"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["route"], "/about")
        self.assertEqual(response.data["title"], "About")
        block_types = [block["block_type"] for block in response.data["blocks"]]
        self.assertEqual(block_types, ["hero", "rich_text"])

    def test_root_route_served(self):
        CMSPage.objects.create(route="/", title="Home", status="published")
        response = self.client.get(self.page_url(""))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["route"], "/")

    def test_draft_page_404s_anonymously(self):
        CMSPage.objects.create(route="/draft", title="Draft", status="draft")
        response = self.client.get(self.page_url("draft"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unknown_route_404s(self):
        response = self.client.get(self.page_url("missing"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_preview_returns_draft(self):
        CMSPage.objects.create(route="/draft", title="Draft", status="draft")
        staff = User.objects.create_user(
            email="staff@example.com", password="StrongPass123!", is_staff=True
        )
        self.authenticate(staff)
        response = self.client.get(self.page_url("draft"), {"preview": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Draft")

    def test_non_staff_preview_404s_on_draft(self):
        CMSPage.objects.create(route="/draft", title="Draft", status="draft")
        user = User.objects.create_user(email="user@example.com", password="StrongPass123!")
        self.authenticate(user)
        response = self.client.get(self.page_url("draft"), {"preview": "true"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_archived_page_404s_even_in_preview(self):
        CMSPage.objects.create(route="/old", title="Old", status="archived")
        staff = User.objects.create_user(
            email="staff2@example.com", password="StrongPass123!", is_staff=True
        )
        self.authenticate(staff)
        response = self.client.get(self.page_url("old"), {"preview": "true"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_html_fields_sanitized_in_response(self):
        CMSBlock.objects.create(
            page=self.page,
            block_type="rich_text",
            sort_order=3,
            data={"body_html": '<p>ok</p><script>alert(1)</script><a href="x" onclick="evil()">x</a>'},
        )
        response = self.client.get(self.page_url("about"))
        body_html = response.data["blocks"][-1]["data"]["body_html"]
        self.assertNotIn("<script>", body_html)
        self.assertNotIn("onclick", body_html)
        self.assertIn("<p>ok</p>", body_html)


class AssetValidationTests(APITestCase):
    PNG_HEADER = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16

    def test_oversize_file_rejected(self):
        upload = SimpleUploadedFile("big.png", self.PNG_HEADER)
        upload.size = 21 * 1024 * 1024
        with self.assertRaises(ValidationError):
            validate_asset_file_size(upload)

    def test_extension_content_mismatch_rejected(self):
        upload = SimpleUploadedFile("fake.png", b"\xff\xd8\xff" + b"\x00" * 16)
        with self.assertRaises(ValidationError):
            validate_asset_file_type(upload)

    def test_valid_png_accepted(self):
        upload = SimpleUploadedFile("ok.png", self.PNG_HEADER)
        validate_asset_file_type(upload)

    def test_svg_with_script_rejected(self):
        svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        upload = SimpleUploadedFile("bad.svg", svg)
        with self.assertRaises(ValidationError):
            validate_asset_file_type(upload)

    def test_clean_svg_accepted(self):
        svg = b'<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'
        upload = SimpleUploadedFile("ok.svg", svg)
        validate_asset_file_type(upload)
