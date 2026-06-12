from django.urls import path

from cms.views import CMSPageView

app_name = "cms"

urlpatterns = [
    path("pages/", CMSPageView.as_view(), {"route_path": ""}, name="cms-page-root"),
    path("pages/<path:route_path>/", CMSPageView.as_view(), name="cms-page"),
]
