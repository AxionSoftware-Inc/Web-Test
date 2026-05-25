"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/student/student-ui";
import type { ApiExamPack, ApiSession, ApiTest } from "@/shared/api/questlab-api";

export type StudentTestStatus = "assigned" | "in_progress" | "completed" | "available";

const statusLabel: Record<StudentTestStatus, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  available: "Available",
};

const actionLabel: Record<StudentTestStatus, string> = {
  assigned: "Start",
  in_progress: "Continue",
  completed: "View result",
  available: "Start",
};

export function TestCatalogCard({
  test,
  status,
  session,
  relatedCount,
}: {
  test: ApiTest;
  status: StudentTestStatus;
  session?: ApiSession;
  relatedCount: number;
}) {
  const router = useRouter();

  const detailHref = `/student/tests/${test.slug}`;
  const actionHref =
    status === "in_progress" && session
      ? `/student/test-session/${session.id}`
      : status === "completed" && session
        ? `/student/results/${session.id}`
        : `/student/tests/${test.slug}/start`;

  return (
    <article className="quest-card flex min-h-[158px] flex-col p-4 transition hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={detailHref} className="block">
            <h3 className="line-clamp-2 text-base font-semibold leading-5 text-ink hover:underline">
              {test.title}
            </h3>
          </Link>

          <p className="mt-1 line-clamp-1 text-sm text-muted">
            {test.subject_slug} · {test.topic_slug}
          </p>
        </div>

        <Badge>{statusLabel[status]}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">
          {test.test_questions.length} questions
        </span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">
          {test.estimated_minutes} min
        </span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">
          {test.difficulty}
        </span>
        {relatedCount > 0 ? (
          <span className="rounded-lg bg-surface-soft px-2 py-1">
            {relatedCount} related
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <Link href={detailHref} className="text-sm font-semibold text-muted hover:text-ink">
          Details
        </Link>

        <Button
          type="button"
          onClick={() => router.push(actionHref)}
          variant={status === "completed" ? "secondary" : "default"}
          size="sm"
        >
          {actionLabel[status]}
        </Button>
      </div>
    </article>
  );
}

export function PackCard({ pack }: { pack: ApiExamPack }) {
  return (
    <article className="quest-card flex min-h-[158px] flex-col p-4 transition hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/student/packs/${pack.slug}`} className="block">
            <h3 className="line-clamp-2 text-base font-semibold leading-5 text-ink hover:underline">
              {pack.title}
            </h3>
          </Link>

          <p className="mt-1 line-clamp-1 text-sm text-muted">
            {pack.exam_type || "Exam pack"}
          </p>
        </div>

        <Badge>{pack.visibility}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">
          {pack.item_count} tests
        </span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">
          {pack.price_label || "Free"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-sm text-muted">Pack workspace</span>

        <Button asChild size="sm">
          <Link href={`/student/packs/${pack.slug}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}
