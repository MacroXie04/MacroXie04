import sys
import types
from unittest import mock

from django.test import SimpleTestCase, override_settings

from core.dynamodb import (
    DynamoDBConfigurationError,
    get_dynamodb_table,
    reset_dynamodb_resource_cache,
)


class DynamoDBSettingsTests(SimpleTestCase):
    def setUp(self):
        reset_dynamodb_resource_cache()

    def tearDown(self):
        reset_dynamodb_resource_cache()

    @override_settings(
        AWS_REGION="us-east-1",
        DYNAMODB_TABLE_NAME="test-table",
        DYNAMODB_ENDPOINT_URL="http://localhost:8000",
        DYNAMODB_CONNECT_TIMEOUT=2,
        DYNAMODB_READ_TIMEOUT=4,
        DYNAMODB_MAX_ATTEMPTS=5,
    )
    def test_get_dynamodb_table_uses_configured_settings(self):
        fake_boto3 = types.ModuleType("boto3")
        fake_botocore = types.ModuleType("botocore")
        fake_botocore_config = types.ModuleType("botocore.config")
        fake_resource = mock.Mock()
        fake_table = mock.Mock()
        fake_resource.Table.return_value = fake_table
        fake_boto3.resource = mock.Mock(return_value=fake_resource)

        class FakeConfig:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        fake_botocore_config.Config = FakeConfig

        with mock.patch.dict(
            sys.modules,
            {
                "boto3": fake_boto3,
                "botocore": fake_botocore,
                "botocore.config": fake_botocore_config,
            },
        ):
            table = get_dynamodb_table()

        self.assertEqual(table, fake_table)
        fake_boto3.resource.assert_called_once()
        service_name = fake_boto3.resource.call_args.args[0]
        kwargs = fake_boto3.resource.call_args.kwargs
        self.assertEqual(service_name, "dynamodb")
        self.assertEqual(kwargs["region_name"], "us-east-1")
        self.assertEqual(kwargs["endpoint_url"], "http://localhost:8000")
        self.assertEqual(
            kwargs["config"].kwargs,
            {
                "connect_timeout": 2,
                "read_timeout": 4,
                "retries": {"max_attempts": 5, "mode": "standard"},
            },
        )
        fake_resource.Table.assert_called_once_with("test-table")

    @override_settings(DYNAMODB_TABLE_NAME="")
    def test_get_dynamodb_table_requires_table_name(self):
        with self.assertRaisesMessage(
            DynamoDBConfigurationError,
            "DYNAMODB_TABLE_NAME must be configured.",
        ):
            get_dynamodb_table()
