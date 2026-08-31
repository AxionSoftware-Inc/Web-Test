# QuestLab Backend

Minimal Django REST Framework backend for the frontend MVP.

## Stack

- Django 5.2
- Django REST Framework
- PostgreSQL
- drf-spectacular for API docs

## Database

Development uses SQLite by default. Production requires PostgreSQL and explicit environment variables; no production database password is stored in the repository.

## Setup

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

## Main Flow

Frontend hierarchy:

```text
subjects -> topics -> levels -> tests -> start session -> answer -> submit
```

API endpoints:

```text
GET  /api/subjects/
GET  /api/subjects/{subjectSlug}/topics/
GET  /api/topics/{topicSlug}/levels/
GET  /api/topics/{topicSlug}/tests/?difficulty=beginner
GET  /api/tests/{testSlug}/
GET  /api/questions/{questionId}/solution/
POST /api/tests/{testSlug}/start/
POST /api/sessions/{sessionId}/answer/
POST /api/sessions/{sessionId}/submit/
GET  /api/sessions/{sessionId}/result/
GET  /api/health/
```

Collection endpoints use DRF page-number pagination (`page_size` up to 100). `/api/v1/` is the versioned alias; `/api/` remains available for compatibility.

Docs:

```text
GET /api/docs/
GET /api/schema/
```

The human-readable contract, request examples, public-vs-management rules, and import format are in [../docs/api-reference.md](../docs/api-reference.md). The canonical test pack schema is [../docs/schemas/test-pack-v1.schema.json](../docs/schemas/test-pack-v1.schema.json). Use `/api/v1/` for new clients; `/api/` remains a compatibility alias. Imports accept `status: draft|published`; they are limited to 200 tests and 5,000 questions per request.
