import { notFound } from "next/navigation";

import { questApi } from "@/shared/api/questlab-api";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Card } from "@/components/ui/card";
import { byIdOrSlug, GenericEntityCard, TeacherSectionHeader } from "@/features/platform/ui/panel-shared";

export async function PackDetailPage({ packId, base = "/admin/packs" }: { packId: string; base?: string }) {
  const packs = await questApi.examPacks();
  const pack = byIdOrSlug(packs, packId);
  if (!pack) notFound();
  const items = await questApi.examPackItems(pack.slug).catch(() => []);
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Tests" /><div className="mt-4 quest-card-grid-3">{items.map((item) => <GenericEntityCard key={item.id} title={item.title} href={`${base}/${pack.slug}`} meta={`${item.difficulty} / ${item.question_count} questions`} stats={[{ label: "Order", value: item.order }, { label: "Required", value: item.is_required ? "yes" : "no" }]} />)}{!items.length ? <QuestEmptyState title="No tests in pack" /> : null}</div></Card>
    </QuestPage>
  );
}

export function ReportsPage({ role = "Admin" }: { role?: string }) {
  const base = role.toLowerCase();
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Report workspaces" />
          <div className="mt-4 quest-card-grid-3">
            <GenericEntityCard title="Performance report" href={`/${base}/reports/performance`} meta="Scores, attempts and class progress" stats={[{ label: "Scope", value: role }, { label: "Format", value: "CSV" }]} />
            <GenericEntityCard title="Weak topic report" href={`/${base}/reports/weak-topics`} meta="Topic and skill mastery signals" stats={[{ label: "Chart", value: "Bar" }, { label: "Status", value: "ready" }]} />
            <GenericEntityCard title="Question quality report" href={`/${base}/reports/questions`} meta="Reported or low-performing questions" stats={[{ label: "Review", value: "manual" }, { label: "Priority", value: "medium" }]} />
            <GenericEntityCard title="Session export" href={`/${base}/reports/sessions`} meta="Submitted sessions and result exports" stats={[{ label: "Export", value: "CSV" }, { label: "Data", value: "live" }]} />
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <TeacherSectionHeader title="Report readiness" />
            <div className="mt-4">
              <WeakTopicBars rows={[
                { label: "Performance", value: 92, meta: "available" },
                { label: "Weak topics", value: 86, meta: "available" },
                { label: "Question quality", value: 64, meta: "needs review data" },
                { label: "Exports", value: 78, meta: "CSV ready" },
              ]} />
            </div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export function SettingsPage({ role = "Admin" }: { role?: string }) {
  return (
    <QuestPage variant="reading">
      <Card className="p-5">
        <TeacherSectionHeader title={`${role} settings`} />
        <div className="mt-4 grid gap-3">
          <GenericEntityCard title="Profile" href="/profile" meta="Username, phone and active role" />
          <GenericEntityCard title="Access control" href="/profile" meta="Role permissions and workspace access" />
          <GenericEntityCard title="Data export" href="/profile" meta="Report export preferences and account data" />
        </div>
      </Card>
    </QuestPage>
  );
}
