import Link from "next/link";

import { EmptyState } from "@/components/questlab/feedback/empty-state";
import { PageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { SectionHeader } from "@/components/questlab/layout/section-header";
import { StatCard } from "@/components/questlab/cards/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tests = await questApi.tests().catch(() => []);
  const draftTests = tests.filter((test) => test.status === "draft");
  const publishedTests = tests.filter((test) => test.status === "published");

  return (
    <QuestPage variant="wide">
      <PageHeader
        eyebrow="Teacher"
        title="Add test"
        copy="Create, review and publish assessment content before assigning it to classes."
        actions={<Button asChild><Link href="/crud">Open question editor</Link></Button>}
      />
      <div className="quest-metric-grid">
        <StatCard label="Tests" value={tests.length} />
        <StatCard label="Published" value={publishedTests.length} />
        <StatCard label="Draft" value={draftTests.length} />
        <StatCard label="Questions linked" value={tests.reduce((sum, test) => sum + test.test_questions.length, 0)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <SectionHeader title="Authoring workflow" />
          <div className="mt-4 quest-card-grid-3">
            <ActionCard title="Create questions" copy="Add question body, answer options, solution and skills." href="/crud" action="Open editor" />
            <ActionCard title="Review drafts" copy="Check incomplete tests before assigning them to a class." href="/teacher/add-test" action="Review" />
            <ActionCard title="Assign to class" copy="Open a live session or homework after publishing." href="/teacher/classes" action="Assign" />
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <SectionHeader title="Draft tests" />
            <div className="mt-4 grid gap-3">
              {draftTests.slice(0, 5).map((test) => (
                <Link key={test.id} href={`/teacher/tests/${test.slug}/edit`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
                  <p className="line-clamp-1 text-sm font-semibold">{test.title}</p>
                  <p className="mt-1 text-xs text-muted">{test.subject_slug} / {test.topic_slug} / {test.test_questions.length} questions</p>
                </Link>
              ))}
              {!draftTests.length ? <EmptyState title="No draft tests" /> : null}
            </div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}

function ActionCard({ title, copy, href, action }: { title: string; copy: string; href: string; action: string }) {
  return (
    <Card className="flex min-h-[150px] flex-col p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{copy}</p>
      <Button asChild size="sm" className="mt-auto w-fit">
        <Link href={href}>{action}</Link>
      </Button>
    </Card>
  );
}
