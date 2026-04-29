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
