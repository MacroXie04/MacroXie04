from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from cms.models import CMSPage
from cms.serializers import CMSPageSerializer


class CMSPageView(APIView):
    """Serve a published CMS page by its route path."""

    # Session auth lets a logged-in admin open ?preview=true in the browser;
    # JWT covers API clients. GET is CSRF-exempt under SessionAuthentication.
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, route_path=""):
        route = f"/{route_path}" if route_path else "/"
        is_preview = request.query_params.get("preview") == "true"

        qs = CMSPage.objects.prefetch_related("blocks")
        if is_preview and request.user.is_staff:
            qs = qs.filter(route=route).exclude(status="archived")
        else:
            qs = qs.filter(route=route, status="published")

        page = qs.first()
        if page is None:
            return Response({"detail": "Page not found."}, status=404)

        return Response(CMSPageSerializer(page).data)
