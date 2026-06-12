"""CMS block type choices, schemas, and validation."""

from django.core.exceptions import ValidationError

from cms.sanitize import validate_safe_url

BLOCK_TYPE_CHOICES = [
    ("hero", "Hero Banner"),
    ("rich_text", "Rich Text"),
    ("image_text", "Image + Text"),
    ("link_list", "Link List"),
    ("faq_list", "FAQ List"),
    ("table", "Data Table"),
]

BLOCK_TYPE_KEYS = {choice[0] for choice in BLOCK_TYPE_CHOICES}

BLOCK_SCHEMAS = {
    "hero": {"required": [], "optional": ["heading", "subheading", "image_url", "image_alt"]},
    "rich_text": {"required": ["body_html"], "optional": ["heading", "heading_level"]},
    "image_text": {"required": ["body_html"], "optional": ["image_url", "image_alt", "image_position", "heading"]},
    "link_list": {"required": ["items"], "optional": ["heading", "style"]},
    "faq_list": {"required": ["items"], "optional": ["heading"]},
    "table": {"required": ["columns", "rows"], "optional": ["heading"]},
}


def validate_block_data(block_type, data):
    """Validate block data against its type schema."""
    if block_type not in BLOCK_SCHEMAS:
        raise ValidationError(f"Unknown block type: {block_type}")

    schema = BLOCK_SCHEMAS[block_type]
    for field in schema["required"]:
        if field not in data:
            raise ValidationError(f"Block type '{block_type}' requires field '{field}'.")

    if block_type == "link_list":
        _validate_item_urls(data, prefix="Link")


def _validate_item_urls(data, *, prefix):
    items = data.get("items", [])
    if not isinstance(items, list):
        return
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        url = item.get("url", "")
        if url and not validate_safe_url(url):
            raise ValidationError(
                f"{prefix} #{index + 1}: URL uses an unsafe scheme. Only http, https, mailto, and tel URLs are allowed."
            )
