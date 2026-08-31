# QuestLab

QuestLab is a Next.js platform prototype for global problem-solving education across programming, mathematics, physics, logic and future technical subjects.

## Product Direction

The full site map, product modules, user roles, MVP scope and long-term architecture are documented here:

- [docs/project-overview.md](docs/project-overview.md)
- [docs/site-map.md](docs/site-map.md)
- [docs/expansion-plan.md](docs/expansion-plan.md)
- [docs/architecture-audit.md](docs/architecture-audit.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/schemas/test-pack-v1.schema.json](docs/schemas/test-pack-v1.schema.json)

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If that port is busy, Next.js can be started on another port:

```bash
npm run dev -- --port 3001
```

## Checks

```bash
npm run lint
npm run build
```

The backend checks and deployment runbook are in [docs/operations.md](docs/operations.md). GitHub Actions is intentionally disabled; run the release gates locally or from the deployment host.

## Authentication

Development authentication uses a local identity stored in the browser. The login and register screens create or update a `RoleProfile` through the backend API; no external account provider is required. This is suitable for the current prototype, but production authentication should add server-managed sessions or tokens and real authorization checks.

## Content Import Question JSON Structure

The canonical pack-level contract is [docs/schemas/test-pack-v1.schema.json](docs/schemas/test-pack-v1.schema.json), with endpoint and transformation details in [docs/api-reference.md](docs/api-reference.md). The example below is the legacy question-level authoring shape still accepted by the compatibility parser.

Creators and import tools should use this structure for questions. It is an authoring/import format, not the public runtime API contract. `topic_slug` is mandatory because it is the primary grouping key for mastery, mistakes and recommendations.

```json
{
  "id": 1,
  "type": "multiple_choice",
  "title": "Kasrli tenglama",
  "body": "$\\\\frac{x}{4}=6$ tenglamani yeching.",
  "options": ["$x=10$", "$x=18$", "$x=24$", "$x=28$"],
  "answer": "$x=24$",
  "explanation": "$\\\\frac{x}{4}=6 \\\\Rightarrow x=6\\\\cdot4 \\\\Rightarrow x=24$.",
  "subject": "Algebra",
  "topic": "Kasrli tenglamalar",
  "topic_slug": "fraction-equations",
  "skills": ["fraction-equation", "multiplication-property"],
  "level": "beginner",
  "difficulty": "easy",
  "estimated_seconds": 25,
  "mastery_weight": 1,
  "is_fundamental": true,
  "prerequisites": ["linear-equations"],
  "mistake_tags": ["fraction-error", "transformation-error"],
  "remediation": {
    "practice_slug": "fraction-equations-practice",
    "lesson_slug": "fraction-equations-review"
  }
}
```

Notes:

- Use 1-3 short skill tags per question.
- Use `estimated_seconds` only as a mastery signal, not as a harsh student-facing judgment.
- Use `mastery_weight` `1` by default. Increase it only for important or harder questions.
- Store historical answer analysis from metadata snapshots so edited questions do not rewrite old results.

The public test API intentionally omits answer keys and explanations. Solutions are available only through the explicit `/api/questions/{id}/solution/` endpoint, and submitted session results are calculated and snapshotted by the backend.
