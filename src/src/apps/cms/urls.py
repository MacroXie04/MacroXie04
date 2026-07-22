from django.urls import include, path

from apps.cms.views.analytics import PageViewCreateView
from apps.cms.views.cms import CMSLivePreviewView, CMSPageView, CMSPreviewFetchView
from apps.cms.views.layout import EmbedBlockView
from apps.cms.views.news import NewsDetailAPIView, NewsListAPIView

cms_urlpatterns = [
    path("live-preview/<uuid:page_id>/", CMSLivePreviewView.as_view(), name="cms-live-preview"),
    path("preview/<str:token>/", CMSPreviewFetchView.as_view(), name="cms-preview-fetch"),
    path("pages/", CMSPageView.as_view(), {"route_path": ""}, name="cms-page-root"),
    path("pages/<path:route_path>/", CMSPageView.as_view(), name="cms-page"),
    path("embed/<slug:embed_slug>/", EmbedBlockView.as_view(), name="cms-embed-block"),
]

news_urlpatterns = [
    path("", NewsListAPIView.as_view(), name="news-list"),
    path("<uuid:pk>/", NewsDetailAPIView.as_view(), name="news-detail"),
]

analytics_urlpatterns = [
    path("pageview/", PageViewCreateView.as_view(), name="pageview-create"),
]

urlpatterns = [
    path("cms/", include((cms_urlpatterns, "cms"), namespace="cms")),
    path("news/", include((news_urlpatterns, "news"), namespace="news")),
    path("analytics/", include((analytics_urlpatterns, "analytics"), namespace="analytics")),
]
