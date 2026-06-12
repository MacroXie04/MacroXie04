import os

from django import forms
from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from cms.asset_validation import ALLOWED_ASSET_EXTENSIONS, IMAGE_ASSET_EXTENSIONS
from cms.models import CMSAsset, CMSBlock, CMSPage, validate_cms_route

_IMAGE_EXTENSIONS = {f".{ext}" for ext in IMAGE_ASSET_EXTENSIONS}
_ACCEPT_EXTENSIONS = ",".join(f".{ext}" for ext in ALLOWED_ASSET_EXTENSIONS)


class CMSPageAdminForm(forms.ModelForm):
    def clean_route(self):
        route = validate_cms_route(self.cleaned_data.get("route"))
        conflict = CMSPage.objects.filter(route=route).exclude(pk=self.instance.pk).first()
        if conflict:
            raise forms.ValidationError(f'Route "{route}" is already used by "{conflict.title}".')
        return route

    class Meta:
        model = CMSPage
        fields = "__all__"


class CMSBlockInline(admin.StackedInline):
    model = CMSBlock
    fields = ("block_type", "sort_order", "admin_label", "data")
    extra = 0
    ordering = ("sort_order",)


@admin.register(CMSPage)
class CMSPageAdmin(admin.ModelAdmin):
    form = CMSPageAdminForm
    list_display = ("title", "route", "status", "block_count", "updated_at")
    list_filter = ("status",)
    search_fields = ("title", "route")
    readonly_fields = ("published_at", "created_at", "updated_at")
    inlines = [CMSBlockInline]
    actions = ["publish_selected", "unpublish_to_draft", "archive_selected"]
    fieldsets = (
        ("Page Info", {"fields": ("route", "title", "meta_description", "status")}),
        ("Timestamps", {"fields": ("published_at", "created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_block_count=Count("blocks"))

    @admin.display(description="Blocks", ordering="_block_count")
    def block_count(self, obj):
        return getattr(obj, "_block_count", obj.blocks.count())

    @admin.action(description="Publish selected pages")
    def publish_selected(self, request, queryset):
        # Save instances individually so CMSPage.save() stamps published_at.
        for page in queryset:
            page.status = "published"
            page.save()
        self.message_user(request, f"Published {queryset.count()} page(s).")

    @admin.action(description="Unpublish selected pages to draft")
    def unpublish_to_draft(self, request, queryset):
        updated = queryset.update(status="draft")
        self.message_user(request, f"Moved {updated} page(s) to draft.")

    @admin.action(description="Archive selected pages")
    def archive_selected(self, request, queryset):
        updated = queryset.update(status="archived")
        self.message_user(request, f"Archived {updated} page(s).")


class CMSAssetAdminForm(forms.ModelForm):
    class Meta:
        model = CMSAsset
        fields = "__all__"
        widgets = {
            "file": forms.ClearableFileInput(attrs={"accept": _ACCEPT_EXTENSIONS}),
        }


@admin.register(CMSAsset)
class CMSAssetAdmin(admin.ModelAdmin):
    form = CMSAssetAdminForm
    list_display = ("name", "file_preview", "public_url_link", "updated_at")
    search_fields = ("name", "file")
    readonly_fields = ("public_url_link", "file_preview", "created_at", "updated_at")
    fieldsets = (
        ("Asset", {"fields": ("name", "file", "public_url_link", "file_preview")}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Public URL")
    def public_url_link(self, obj):
        if not obj.file:
            return "-"
        return format_html('<a href="{0}" target="_blank" rel="noopener noreferrer">{0}</a>', obj.public_url)

    @admin.display(description="Preview")
    def file_preview(self, obj):
        if not obj.file:
            return "-"
        _, ext = os.path.splitext(obj.file.name)
        if ext.lower() in _IMAGE_EXTENSIONS:
            return format_html(
                '<a href="{0}" target="_blank" rel="noopener noreferrer">'
                '<img src="{0}" alt="{1}" style="max-height: 64px; max-width: 140px; object-fit: contain;" />'
                "</a>",
                obj.public_url,
                obj.name,
            )
        return format_html('<a href="{0}" target="_blank" rel="noopener noreferrer">Open file</a>', obj.public_url)
