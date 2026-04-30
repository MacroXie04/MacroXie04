# Django Backend

This directory contains the Django project initialized with `config.settings`.

## Local Setup

```sh
cd src
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The default development server runs at `http://127.0.0.1:8000/`.

## Settings Modules

The backend has separate settings modules for each environment:

```sh
export DJANGO_SETTINGS_MODULE=config.settings.dev
export DJANGO_SETTINGS_MODULE=config.settings.ci
export DJANGO_SETTINGS_MODULE=config.settings.prod
```

`config.settings` remains available as the default development settings module
for existing local commands.

CI uses an in-memory SQLite database for Django's built-in relational tables.

Production requires at least:

```sh
export DJANGO_SETTINGS_MODULE=config.settings.prod
export DJANGO_SECRET_KEY=change-me
export DJANGO_ALLOWED_HOSTS=example.com,www.example.com
```

## DynamoDB Configuration

Django's built-in admin, auth, and session tables still use the default SQLite
database configured by the active settings module. Application code should use
the DynamoDB helper in `core.dynamodb`.

Configure DynamoDB with environment variables:

```sh
export AWS_REGION=us-west-2
export DYNAMODB_TABLE_NAME=macroxie04-app-data
```

For DynamoDB Local, also set:

```sh
export DYNAMODB_ENDPOINT_URL=http://localhost:8000
```

AWS credentials are resolved by the standard AWS SDK credential chain, such as
environment variables, shared AWS config files, or an attached IAM role.

## Auth API

User accounts are managed by the `authn` app with email-based login and JWT
tokens:

- `POST /api/auth/signup/`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/logout/`
- `GET/PATCH /api/auth/me/`
- `POST /api/auth/password/change/`
