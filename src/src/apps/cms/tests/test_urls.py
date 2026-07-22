from django.test import SimpleTestCase
from django.urls import reverse


class CmsUrlsTests(SimpleTestCase):
    def test_urls_keep_their_existing_paths_and_namespaces(self):
        self.assertEqual(reverse("cms:cms-page-root"), "/cms/pages/")
        self.assertEqual(reverse("news:news-list"), "/news/")
        self.assertEqual(reverse("analytics:pageview-create"), "/analytics/pageview/")
