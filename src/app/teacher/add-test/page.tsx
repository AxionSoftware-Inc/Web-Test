import Link from "next/link";

import { EmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { SectionHeader } from "@/components/questlab/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tests = await questApi.tests().catch(() => []);
  const draftTests = tests.filter((test) => test.status === "draft");

  return (
    <QuestPage variant="wide">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <SectionHeader title="Test qo&apos;shish" copy="Sizga qulay usulni tanlang — tayyor matnni joylash eng tez yo&apos;l." />
          <div className="mt-4 quest-card-grid-3">
            <ActionCard title="Tayyor matndan qo&apos;shish" copy="Word, Telegram yoki AI’dan savollarni ko&apos;chiring — tizim o&apos;zi ajratadi." href="/crud" action="Boshlash" />
            <ActionCard title="Qoralamalarni tekshirish" copy="Tugallanmagan testlarni ko&apos;rib chiqing va kerak bo&apos;lsa tahrirlang." href="/teacher/tests" action="Ko&apos;rish" />
            <ActionCard title="Sinfga biriktirish" copy="Tayyor testni sinfga yuboring yoki mashq sifatida bering." href="/teacher/classes" action="Biriktirish" />
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <SectionHeader title="Qoralama testlar" />
            <div className="mt-4 grid gap-3">
              {draftTests.slice(0, 5).map((test) => (
                <Link key={test.id} href={`/teacher/tests/${test.slug}/edit`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
                  <p className="line-clamp-1 text-sm font-semibold">{test.title}</p>
                  <p className="mt-1 text-xs text-muted">{test.subject_slug} / {test.topic_slug} / {test.test_questions.length} questions</p>
                </Link>
              ))}
              {!draftTests.length ? <EmptyState title="Qoralama test yo&apos;q" /> : null}
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
