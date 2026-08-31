# QuestLab architecture audit

Reviewed: 2026-08-31.

## Short verdict

The project is beyond a basic CRUD backend: it has a real assessment flow, server-side scoring, immutable result snapshots, analytics aggregation, audit events, a client mastery engine, and a topic graph. It is still a prototype-grade domain engine, not a production adaptive-learning platform yet.

The main problem is consistency, not raw performance. Several layers previously calculated the same answer differently, the frontend and backend had separate normalization logic, and the importer accepted a wider shape than the documented format. The first cleanup therefore centralizes contracts and scoring before adding a native engine.

## Current shape

```text
Next.js App Router
  app/                 route entrypoints only
  features/            product modules and UI/domain behavior
  components/          older shared UI groups still being consolidated
  shared/              API client, shared UI, config, and primitives

Django REST API
  config/              settings, URL roots, OpenAPI setup
  learning/            current bounded-context app
    models.py          taxonomy, content, sessions, organizations
    serializers.py     transport shapes
    views.py           endpoint orchestration (still large)
    services/
      scoring.py       authoritative answer/result engine
      analytics.py     class/school/pack aggregates
      audit.py         business event recording
```

## Findings

### Test format

There was a strict `version: "1.0"` convention in frontend examples and backend import handling, but it was not a formally enforced shared schema. The importer also supported CSV, Markdown, Uzbek aliases, and legacy difficulty names. That is useful for ingestion, but it blurred the canonical format.

This audit adds [the formal v1 JSON Schema](schemas/test-pack-v1.schema.json) and [the API/import reference](api-reference.md). New content should use the canonical schema; legacy aliases remain an explicit compatibility layer.

### Architecture cleanliness

The frontend is feature-oriented, but not completely uniform. `app` route entrypoints are clean, while feature code still imports the global `questApi` directly in many UI components. Older `components/student`, `components/questlab`, and `shared/ui` groups coexist, and documentation describes an `entities/` layer that is not currently present.

The backend has useful service boundaries, but `learning/views.py` is still a large orchestration module. It is acceptable for the current vertical slice, but the next split should be by bounded context: content, assessment, classroom, organization, and import rather than by arbitrary file size.

### Single core usage

Before this audit, `profile_summary` and `mistakes_summary` used direct string comparison while analytics and result snapshots used `services/scoring.py`. Frontend mastery adapters also had their own normalization call path. This could make multiple-choice, whitespace, or LaTeX answers disagree across screens.

The authoritative backend scorer is now used by profile and mistake aggregation, and the frontend assessment/mastery paths use one shared answer-scoring helper. Submitted results remain backend-authoritative.

There is still one intentional boundary: frontend mastery heuristics and backend result scoring are different responsibilities. They must share versioned evidence and policy definitions before mastery itself is moved server-side.

### Engine maturity

The current engine has meaningful domain behavior:

- answer normalization and multiple-choice set matching;
- score/result snapshot generation;
- time-quality and difficulty signals;
- confidence, mastery, priority, weak-topic and weak-skill calculations;
- prerequisite-aware recommendations;
- class and school analytics;
- audit events.

Its limitations are material:

- scoring thresholds and multipliers are hard-coded heuristics;
- topic prerequisites are hard-coded to an algebra graph on the client;
- time, answer changes, hints, and tab-switch evidence are not a durable backend event model;
- mastery is recomputed in browser storage and is not a server-owned projection;
- content import normalization is still more permissive than the canonical schema;
- analytics and recommendation policies have no independently versioned configuration or calibration dataset.

So it is a domain prototype engine, not “just a backend”, but it is not yet a scientifically calibrated adaptive engine.

### C++ decision

Do not add a C++ engine at this stage. The current bottleneck is contract drift, not CPU. Database and HTTP latency dominate these operations, while a C++ core would add FFI or service boundaries, packaging, deployment, debugging, and cross-language parity costs.

The correct sequence is:

1. Keep the backend scorer as a pure, versioned domain core and make every server aggregate call it.
2. Define durable evidence events and a canonical assessment snapshot.
3. Move mastery policy to a server-owned projection or a shared policy package.
4. Benchmark real workloads and profile before changing languages.
5. If programming judge/sandbox execution is added, isolate that workload as a separate worker. Rust or C++ may be justified there; it should not be coupled to CRUD, taxonomy, or normal assessment scoring.

## Recommended next changes

### P0 — before production

- implement server-managed authentication and RBAC (currently out of this task's scope);
- scope every session, management code, and analytics query to an authorized owner/class/school;
- move management/access codes from plaintext storage to hashes or a secret vault;
- run PostgreSQL with production settings, TLS reverse proxy, backups, and dependency security updates;
- add API contract tests for every write action and permission boundary.

### P1 — next engineering slice

- extract content, assessment, classroom, organization, and import services from `views.py`;
- persist answer timing/change/hint evidence as append-only attempt events;
- make mastery policy and topic graphs data-driven and versioned;
- generate frontend API types from the canonical OpenAPI document or validate transport with a runtime schema;
- add import validation that reports schema paths before any database writes;
- add frontend unit tests for scoring, parser normalization, and mastery edge cases.

### P2 — scale and product maturity

- queue analytics projections for large cohorts;
- add content quality/review workflows and question calibration metrics;
- introduce a separate judge worker only for code execution;
- add observability dashboards, rate-limit policy per operation, and restore drills.

## Definition of “clean core”

The architecture should be considered ready for a larger team when the following are true:

- one documented assessment event/snapshot contract exists;
- one authoritative scoring policy is used by result, profile, mistake, class, and school projections;
- no UI imports transport details outside a feature API/query boundary;
- every bounded context has services/use cases separate from HTTP views;
- topic graphs and mastery policy are versioned data, not algebra-only source constants;
- OpenAPI and the human API reference agree, and contract tests run against both `/api/v1/` and the compatibility alias.
