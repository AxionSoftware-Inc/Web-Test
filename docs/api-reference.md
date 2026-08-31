# QuestLab API reference

Status: canonical v1 contract, reviewed 2026-08-31.

## Contract and base URL

Use the versioned base path:

```text
/api/v1/
```

`/api/` is retained as a compatibility alias. Swagger UI and the generated OpenAPI document intentionally describe only `/api/v1/` so one operation is not documented twice.

- Swagger UI: `GET /api/docs/`
- OpenAPI 3 document: `GET /api/schema/`
- Health: `GET /api/v1/health/` or `GET /health/`

Requests and responses use JSON and UTF-8. Date-time fields are ISO-8601 strings with timezone information. Slugs are URL-safe strings; numeric resource identifiers are integers.

Authentication and RBAC are not part of this contract yet. The current prototype uses public endpoints, browser-stored identity codes, and write-only management/access codes. Do not treat this as production authorization. That hardening is deliberately a separate scope.

## Common response rules

Collection endpoints backed by a DRF viewset return a page-number envelope:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```

Use `?page=2&page_size=50`; `page_size` is capped at 100. Nested action endpoints return a plain array or object as documented below and are not paginated.

Validation errors normally use DRF's field map:

```json
{ "student_code": ["This field is required."] }
```

Import and business-rule errors include a stable diagnostic shape:

```json
{
  "detail": "A pack with this title already exists.",
  "layer": "backend_schema",
  "code": "pack_title_duplicate",
  "field": "pack.title"
}
```

## Canonical test pack format

The exact authoring/import contract is [test-pack-v1.schema.json](schemas/test-pack-v1.schema.json). A canonical payload is:

```json
{
  "version": "1.0",
  "pack": {
    "title": "Linear Algebra Foundations",
    "subject": "math",
    "branch": "linear-algebra",
    "level": "foundations",
    "language": "uz"
  },
  "tests": [
    {
      "title": "Vectors Basics",
      "topic": "vectors",
      "difficulty": "easy",
      "time_limit_minutes": 15,
      "questions": [
        {
          "type": "single_choice",
          "body": "Question text with $LaTeX$",
          "options": [
            { "id": "A", "text": "Option A" },
            { "id": "B", "text": "Option B" }
          ],
          "answer": { "correct": "A" },
          "explanation": "Explanation with $LaTeX$",
          "skills": ["vectors"]
        }
      ]
    }
  ]
}
```

Canonical enums:

- `version`: `1.0`
- question `type`: `single_choice`, `multiple_choice`, `short_answer`
- difficulty: `easy`, `medium`, `hard`
- choice questions require at least two `{id,text}` options; short answers omit `options`
- every question requires at least one `skills` value

The importer still accepts legacy aliases from old files (`prompt`, `savol`, `choices`, `javob`, `beginner`, `advanced`, and similar). Those aliases are a compatibility input layer, not the format new content should be authored in. During import, difficulty maps to database values `beginner`, `intermediate`, `advanced`; options are stored in the database as text arrays. Public runtime responses intentionally omit `answer` and `explanation`; solutions are explicit endpoints only.

## Endpoint reference

### Health and profile

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET | `/health/` or `/api/v1/health/` | — | `{status, database}`; `200` when DB responds, `503` otherwise |
| GET | `/api/v1/profile/role/?identity_code=...` | required `identity_code` | `RoleProfile` |
| PATCH | `/api/v1/profile/role/` | `identity_code`, optional `active_role`, `display_name`, `phone` | updated `RoleProfile` |
| GET | `/api/v1/profile/role-search/?q=...&role=...` | `q` filters email; optional role | up to 8 `RoleProfile` rows |
| GET | `/api/v1/profile/summary/?student_code=...` | optional student code | profile totals, topic progress, weekly activity, recent tests, recommendations |
| GET | `/api/v1/profile/mastery/?student_code=...` | required student code | server-authoritative topic/skill mastery, evidence counts, confidence, priorities, and next actions |
| GET | `/api/v1/mistakes/summary/?student_code=...` | optional student code | mistakes and weak skills |

`RoleProfile` includes `identity_code`, `display_name`, `email`, `phone`, `active_role`, `available_roles`, `created_at`, and `updated_at`.

`profile/mastery` is the learning map used by the student dashboard. `accuracy` is the raw correct-answer ratio; `mastery` discounts low-evidence results (less than six question attempts) and medium-evidence results (six to fourteen attempts), so a single lucky answer is not treated as full knowledge. `recommendations[0]` is the highest-priority next action. The endpoint requires the browser's student identity because progress is personal; authorization and RBAC remain a separate scope.

### Taxonomy and questions

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/subjects/` | Subject fields on POST: `title`, `slug`, optional `description` | paginated `Subject` / created `Subject` |
| GET/PATCH/PUT/DELETE | `/api/v1/subjects/{slug}/` | slug; model fields for writes | `Subject` |
| GET | `/api/v1/subjects/{subject_slug}/topics/` | — | topic array with `test_count` |
| GET | `/api/v1/topics/?subject={subject_slug}` | optional subject slug | paginated `Topic` |
| GET/PATCH/PUT/DELETE | `/api/v1/topics/{slug}/` | slug; model fields for writes | `Topic` |
| GET | `/api/v1/topics/{topic_slug}/levels/` | — | difficulty buckets with tests |
| GET | `/api/v1/topics/{topic_slug}/tests/?difficulty=...&status=...` | optional `difficulty`, `status` | public test array; defaults to published |
| GET/POST | `/api/v1/skills/` | Skill fields on POST: `topic`, `title`, `slug`, optional `description` | paginated `Skill` / created `Skill` |
| GET/PATCH/PUT/DELETE | `/api/v1/skills/{id}/` | numeric id; model fields for writes | `Skill` |
| GET | `/api/v1/questions/?subject=...&topic=...&difficulty=...&type=...` | optional filters | paginated public questions |
| GET | `/api/v1/questions/{id}/` | numeric id | public question without solution |
| GET | `/api/v1/questions/{id}/solution/` | numeric id | question with `answer` and `explanation` |
| POST/PATCH/PUT | `/api/v1/questions/` or `/api/v1/questions/{id}/` | `subject`, `topic`, `skills[]`, `type`, `difficulty`, `prompt`, `options[]`, `answer`, `explanation` | question with solution fields |
| DELETE | `/api/v1/questions/{id}/` | numeric id | `204` |

Public question fields are `id`, `subject`, `topic`, `skills`, `skill_titles`, `type`, `difficulty`, `prompt`, and `options`.

### Tests and sessions

`GET` test endpoints use the public serializer. They do not expose answer keys or explanations.

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET | `/api/v1/tests/?subject=...&topic=...&difficulty=...&status=...` | optional filters | paginated public tests |
| GET | `/api/v1/tests/{test_slug}/` | slug | public test with ordered public questions |
| POST | `/api/v1/tests/` | `title`, `slug?`, `subject`, `topic`, `difficulty`, `estimated_minutes?`, `passing_score?`, `status?`, `creator_name?`, `creator_code?`, `manage_key?`, `questions[]` | created public test |
| PATCH/PUT | `/api/v1/tests/{test_slug}/` | test fields and optional `questions[]`; existing `manage_key` required when configured | updated public test |
| DELETE | `/api/v1/tests/{test_slug}/?manage_key=...` | management key when configured | `204`, or archived draft when sessions exist |
| GET | `/api/v1/tests/{test_slug}/manage/?manage_key=...` | required management key when configured | test with answer/explanation fields |
| POST | `/api/v1/tests/import-pack/` | `{source: TestPackV1, status?: draft\|published, creator_name?, creator_code?, manage_key?, pack_manage_code?}` | `{pack, tests, skipped[]}`; imported tests use the requested status |
| GET | `/api/v1/sessions/?student_code=...` | optional student code and page params | paginated sessions; student code scopes the list to one learner |
| GET | `/api/v1/sessions/{id}/` | numeric id | session and saved answers |
| POST | `/api/v1/tests/{test_slug}/start/` | `student_name`, `student_code` | created in-progress session (`201`) |
| POST | `/api/v1/sessions/{id}/answer/` | `question`, `value`, `is_flagged?` | updated session |
| POST | `/api/v1/sessions/{id}/submit/` | empty JSON body | submitted session; immutable result snapshot is created |
| GET | `/api/v1/sessions/{id}/result/` | submitted session only | authoritative result snapshot |

Answer writes are rejected after submission and when the question does not belong to the session's test. Result scoring is performed by the backend scoring service; the client engine is for interactive diagnostics and does not replace the submitted result.

### Classes

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/classes/` | POST: `name`, `slug`, `teacher_name`, `visibility`, `join_code`, `manage_code?`, `description` | paginated/created class |
| GET/PATCH/PUT/DELETE | `/api/v1/classes/{slug}/` | management code for protected writes | class with assignment summary |
| POST | `/api/v1/classes/{slug}/join/` | `student_name`, `student_code`, `join_code?` | class student |
| GET/POST | `/api/v1/classes/{slug}/students/` | POST adds `name`, `student_code`, `manage_code?` | student array / created student |
| GET/POST | `/api/v1/classes/{slug}/assignments/` | POST: `test`, `title`, optional schedule/policy fields, `manage_code?` | assignment array / created assignment |
| POST | `/api/v1/classes/{slug}/assignments/bulk/` | `{assignments: [{test|test_slug, title?, ...}], manage_code?}` | `{created[], skipped[]}` |
| GET/PATCH/DELETE | `/api/v1/classes/{slug}/assignments/{assignment_id}/` | management code for writes | assignment; delete deactivates if history exists |
| POST | `/api/v1/classes/{slug}/assignments/{assignment_id}/start/` | `student_name`, `student_code`, `join_code?` | created session |
| GET | `/api/v1/classes/{slug}/results/` | optional management code | class attempts, averages, assignment stats, progress, weak skills |

Assignment fields include `mode` (`session` or `homework`), `opens_at`, `closes_at`, `due_at`, `attempt_limit`, `show_answers_after_deadline`, `allow_late_submission`, `grading_policy` (`best`, `latest`, `first`), and `is_active`.

### Schools

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/schools/` | POST: `name`, `slug`, `owner_name`, visibility/portal/branding fields, `manage_code?` | paginated/created school |
| GET/PATCH/PUT/DELETE | `/api/v1/schools/{slug}/` | management code for writes | school |
| GET/POST | `/api/v1/schools/{slug}/teachers/` | POST: `name`, `email?`, `teacher_code?`, `classes?`, `manage_code?` | teacher array / created teacher |
| GET/PATCH/DELETE | `/api/v1/schools/{slug}/teachers/{teacher_id}/` | management code for writes | teacher; delete deactivates |
| GET/POST | `/api/v1/schools/{slug}/classes/` | POST class fields and optional `teacher_id`, `manage_code?` | class array / created class |
| GET | `/api/v1/schools/{slug}/students/` | — | student array across active school classes |
| GET | `/api/v1/schools/{slug}/analytics/` | — | school totals, teacher/class rows, weak skills |

### Exam packs

| Method | Path | Request/query | Response |
| --- | --- | --- | --- |
| GET/POST | `/api/v1/exam-packs/` | POST: `title`, `slug`, `description`, `exam_type`, `visibility`, `access_code`, `manage_code?`, `price_label`, `is_active` | paginated/created pack |
| GET/PATCH/PUT/DELETE | `/api/v1/exam-packs/{slug}/` | management code for writes | pack; delete archives when history exists |
| GET/POST | `/api/v1/exam-packs/{slug}/items/` | POST: `test`, `title`, `order`, `is_required`, `manage_code?` | item array / created item |
| POST | `/api/v1/exam-packs/{slug}/items/bulk/` | `{items: [{test|test_slug, title?, order?, is_required?}], manage_code?}` | `{created[], skipped[]}` |
| POST | `/api/v1/exam-packs/{slug}/items/import-tests/` | `{source: TestPackV1, creator_name?, creator_code?, manage_key?, manage_code?}` | `{created[], tests[], skipped[]}` |
| GET/PATCH/DELETE | `/api/v1/exam-packs/{slug}/items/{item_id}/` | management code for writes | item; delete makes it optional when history exists |
| POST | `/api/v1/exam-packs/{slug}/items/{item_id}/start/` | `student_name`, `student_code`, `access_code?` | created session |
| GET | `/api/v1/exam-packs/{slug}/results/` | optional management code | attempts, item stats, student progress, weak skills |

## End-to-end example

```http
POST /api/v1/tests/algebra-basics/start/
Content-Type: application/json

{"student_name":"Ali Valiyev","student_code":"student-42"}
```

```http
POST /api/v1/sessions/17/answer/
Content-Type: application/json

{"question":91,"value":"x = 24","is_flagged":false}
```

```http
POST /api/v1/sessions/17/submit/
Content-Type: application/json

{}
```

Then fetch `GET /api/v1/sessions/17/result/`. The response contains `scoring_version`, `summary`, ordered question rows, `student_answer`, and `is_correct`. The snapshot is kept stable if source questions are later edited.

## Implementation ownership

- Routing: `backend/config/urls.py`, `backend/learning/urls.py`
- Request/response serializers: `backend/learning/serializers.py`
- Endpoint behavior: `backend/learning/views.py`
- Authoritative scoring: `backend/learning/services/scoring.py`
- Aggregated analytics: `backend/learning/services/analytics.py`
- Typed frontend client: `src/shared/api/questlab-api.ts`
- Interactive mastery diagnostics: `src/features/mastery-engine/model/`

The generated OpenAPI document is the machine-readable transport contract. This document adds business rules, public-vs-management behavior, import semantics, and examples that cannot be inferred reliably from generated schemas alone.
