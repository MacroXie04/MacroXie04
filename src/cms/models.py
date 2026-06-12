import re
import uuid

from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

from cms.asset_validation import (
    ALLOWED_ASSET_EXTENSIONS,
    asset_upload_path,
    validate_asset_file_size,
    validate_asset_file_type,
)
from cms.blocks import BLOCK_TYPE_CHOICES, validate_block_data

ROUTE_SEGMENT_RE = re.compile(r"^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$")


def normalize_cms_route(route):
    """Normalize CMS route paths to a canonical leading-slash/no-trailing-slash form."""
    route = (route or "").strip()
    if not route:
        return "/"

    segments = [segment.strip() for segment in route.split("/") if segment.strip()]
    if not segments:
        return "/"

    return "/" + "/".join(segments)


def validate_cms_route(route):
    """Validate a normalized CMS route."""
    normalized = normalize_cms_route(route)

    if normalized == "/":
        return normalized

    for segment in normalized.strip("/").split("/"):
        if not ROUTE_SEGMENT_RE.fullmatch(segment):
            raise ValidationError(
                "Each path segment must use letters, numbers, hyphens, or underscores only.",
            )

    return normalized


class UUIDTimestampedModel(models.Model):
    """Abstract base: UUID primary key plus automatic timestamps."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True


class CMSPage(UUIDTimestampedModel):
    """A CMS-managed page. One record per frontend route."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    route = models.CharField(
        max_length=200,
        unique=True,
        help_text="Frontend route path, e.g. '/about'. Must start with '/'.",
    )
    title = models.CharField(max_length=300)
    meta_description = models.TextField(blank=True, default="")

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft", db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "CMS Page"
        verbose_name_plural = "CMS Pages"
        indexes = [
            models.Index(fields=["route", "status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.route})"

    def clean(self):
        super().clean()
        try:
            self.route = validate_cms_route(self.route)
        except ValidationError as exc:
            raise ValidationError({"route": exc.messages})

    def save(self, *args, **kwargs):
        self.route = normalize_cms_route(self.route)
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class CMSBlock(UUIDTimestampedModel):
    """A content block within a CMS page."""

    page = models.ForeignKey(CMSPage, on_delete=models.CASCADE, related_name="blocks")
    block_type = models.CharField(max_length=30, choices=BLOCK_TYPE_CHOICES)
    sort_order = models.IntegerField(default=0)
    data = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    admin_label = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Label shown in admin for easier identification.",
    )

    class Meta:
        ordering = ["sort_order"]
        verbose_name = "Content Block"
        verbose_name_plural = "Content Blocks"
        indexes = [
            models.Index(fields=["page", "sort_order"]),
        ]

    def __str__(self):
        label = self.admin_label or self.get_block_type_display()
        return f"{label} (#{self.sort_order})"

    def clean(self):
        super().clean()
        validate_block_data(self.block_type, self.data)


class CMSAsset(UUIDTimestampedModel):
    """Reusable uploaded asset for CMS editors."""

    name = models.CharField(max_length=200)
    file = models.FileField(
        upload_to=asset_upload_path,
        validators=[
            FileExtensionValidator(ALLOWED_ASSET_EXTENSIONS),
            validate_asset_file_size,
            validate_asset_file_type,
        ],
    )

    class Meta:
        ordering = ["name", "created_at"]
        verbose_name = "CMS Asset"
        verbose_name_plural = "CMS Assets"

    def __str__(self):
        return self.name

    @property
    def public_url(self):
        if not self.file:
            return ""
        return self.file.url
