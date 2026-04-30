from functools import lru_cache

from django.conf import settings


class DynamoDBConfigurationError(RuntimeError):
    """Raised when DynamoDB settings are missing or invalid."""


def _get_client_config():
    from botocore.config import Config

    return Config(
        connect_timeout=settings.DYNAMODB_CONNECT_TIMEOUT,
        read_timeout=settings.DYNAMODB_READ_TIMEOUT,
        retries={
            "max_attempts": settings.DYNAMODB_MAX_ATTEMPTS,
            "mode": "standard",
        },
    )


@lru_cache(maxsize=1)
def get_dynamodb_resource():
    import boto3

    kwargs = {
        "region_name": settings.AWS_REGION,
        "config": _get_client_config(),
    }
    if settings.DYNAMODB_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT_URL

    return boto3.resource("dynamodb", **kwargs)


def get_dynamodb_table(table_name=None):
    resolved_table_name = table_name or settings.DYNAMODB_TABLE_NAME
    if not resolved_table_name:
        raise DynamoDBConfigurationError("DYNAMODB_TABLE_NAME must be configured.")

    return get_dynamodb_resource().Table(resolved_table_name)


def reset_dynamodb_resource_cache():
    get_dynamodb_resource.cache_clear()
