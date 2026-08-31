import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { ApiClassResults, ApiClassStudent, ApiExamPack, ApiExamPackResults, ApiSchool, ApiTeacherClass, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { LatexText } from "@/shared/ui/latex-text";
import { PremiumPanel } from "@/shared/ui/premium-shell";
import { EntityCard as QuestEntityCard } from "@/components/questlab/cards/entity-card";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { SectionHeader } from "@/components/questlab/layout/section-header";
import { Badge } from "@/components/ui/badge";

type Stat = { label: string; value: string | number };
export type PanelCard = { title: string; href: string; meta?: string; copy?: string; stats?: Stat[]; status?: string };
type Card = PanelCard;

export function byIdOrSlug<T extends { id: number; slug?: string }>(items: T[], value: string) {
  return items.find((item) => String(item.id) === value || item.slug === value);
}

export function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : 0;
}

export function maxIsoDate(current?: string | null, next?: string | null) {
  if (!current) return next ?? null;
  if (!next) return current;
  return Date.parse(next) > Date.parse(current) ? next : current;
}

export async function baseData() {
  const [schools, classes, tests, packs] = await Promise.all([
    questApi.schools().catch(() => []),
    questApi.classes().catch(() => []),
    questApi.tests().catch(() => []),
    questApi.examPacks().catch(() => []),
  ]);
  return { schools, classes, tests, packs };
}

export async function classResults(classes: ApiTeacherClass[]) {
  return Promise.all(classes.map((item) => questApi.classResults(item.slug).catch(() => null)));
}

export async function classStudents(classes: ApiTeacherClass[]) {
  return Promise.all(classes.map((item) => questApi.classStudents(item.slug).catch(() => [] as ApiClassStudent[])));
}

export async function packResults(packs: ApiExamPack[]) {
  return Promise.all(packs.map((item) => questApi.examPackResults(item.slug).catch(() => null)));
}

export async function firstSchool() {
  const schools = await questApi.schools();
  const school = schools[0];
  if (!school) notFound();
  return school;
}

export function testCard(test: ApiTest, href: string, used = 0): Card {
  return {
    title: test.title,
    href,
    meta: `${test.subject_slug} / ${test.topic_slug}`,
    status: test.status,
    stats: [
      { label: "Questions", value: test.test_questions.length },
      { label: "Difficulty", value: test.difficulty },
      { label: "Used", value: used },
    ],
  };
}

export function packCard(pack: ApiExamPack, href: string, usage = 0): Card {
  return {
    title: pack.title,
    href,
    meta: pack.exam_type || "Pack",
    copy: pack.description,
    status: pack.is_active ? "published" : "draft",
    stats: [
      { label: "Tests", value: pack.item_count },
      { label: "Usage", value: usage },
      { label: "Visibility", value: pack.visibility },
    ],
  };
}

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <QuestPage variant="wide">
      {children}
    </QuestPage>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PremiumPanel>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </PremiumPanel>
  );
}

export function CardGrid({ cards }: { cards: Card[] }) {
  if (!cards.length) return <EmptyState />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link key={`${card.href}-${card.title}`} href={card.href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.04)] hover:bg-surface-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold"><LatexText text={card.title} /></h3>
              {card.meta ? <p className="mt-1 text-sm text-black/50"><LatexText text={card.meta} /></p> : null}
            </div>
            {card.status ? <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{card.status}</span> : null}
          </div>
           {card.copy ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55"><LatexText text={card.copy} /></p> : null}
          {card.stats?.length ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {card.stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-surface-soft px-3 py-3">
                  <p className="truncate text-sm font-semibold"><LatexText text={String(stat.value)} /></p>
                  <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function TeacherSectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <SectionHeader title={title} actions={action} />;
}

export function TeacherClassSummary({ result }: { result: ApiClassResults }) {
  const weakSkill = result.weak_skills[0];
  return (
    <Link href={`/teacher/classes/${result.classroom.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-semibold">{result.classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{result.students_submitted}/{result.students_total || result.students_submitted} submitted</p>
        </div>
        <Badge variant={result.average_score >= 70 ? "success" : "warning"}>{result.average_score}%</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {weakSkill?.skill ?? "No data"}</p>
    </Link>
  );
}

export function CreatorPackSummary({ pack, usage }: { pack: ApiExamPack; usage?: ApiExamPackResults }) {
  return (
    <Link href={`/creator/packs/${pack.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-semibold">{pack.title}</h3>
          <p className="mt-1 text-sm text-muted">{pack.exam_type || "Pack"} / {pack.item_count} tests</p>
        </div>
        <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "inactive"}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniInfo label="Usage" value={usage?.attempts ?? 0} />
        <MiniInfo label="Students" value={usage?.students_submitted ?? 0} />
        <MiniInfo label="Avg" value={`${usage?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

export function CreatorTestRow({ test, href }: { test: ApiTest; href: string }) {
  return (
    <Link href={href} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-1 text-sm font-semibold">{test.title}</p>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">{test.subject_slug} / {test.topic_slug} / {test.test_questions.length} questions</p>
    </Link>
  );
}

export function CreatorTestCard({ test }: { test: ApiTest }) {
  return (
    <Link href={`/creator/tests/${test.slug}/edit`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{test.title}</h3>
          <p className="mt-1 text-sm text-muted">{test.subject_slug} / {test.topic_slug}</p>
        </div>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.test_questions.length} questions</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.estimated_minutes} min</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.difficulty}</span>
      </div>
    </Link>
  );
}

export function GenericEntityCard({ title, href, meta, copy, stats = [], status }: Card) {
  return <QuestEntityCard title={<LatexText text={title} />} href={href} meta={meta ? <LatexText text={meta} /> : copy ? <LatexText text={copy} /> : undefined} status={status} stats={stats.map((stat) => `${stat.label}: ${stat.value}`)} />;
}

export function AdminSchoolCard({ school }: { school: ApiSchool }) {
  return (
    <Link href={`/admin/schools/${school.slug}`} className="quest-card flex min-h-[165px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{school.name}</h3>
          <p className="mt-1 text-sm text-muted">{school.owner_name || "No owner"}</p>
        </div>
        <Badge variant={school.visibility === "public" ? "success" : "default"}>{school.visibility}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{school.description || school.portal_domain || school.portal_subdomain || "No description"}</p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <MiniInfo label="Teachers" value={school.teacher_count} />
        <MiniInfo label="Invite" value={school.student_invite_code || "Not set"} />
      </div>
    </Link>
  );
}

export function AdminClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/admin/classes/${classroom.slug}`} className="quest-card flex min-h-[160px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{classroom.teacher_name}</p>
        </div>
        <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "No data"}</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {result?.weak_skills[0]?.skill ?? "No weak topic yet"}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.student_count} students</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.assignment_count} assignments</span>
      </div>
    </Link>
  );
}

export function AdminTestCard({ test, used }: { test: ApiTest; used: number }) {
  return (
    <Link href={`/admin/tests/${test.slug}`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{test.title}</h3>
          <p className="mt-1 text-sm text-muted">{test.subject_slug} / {test.topic_slug}</p>
        </div>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.test_questions.length} questions</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{used} assignments</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.difficulty}</span>
      </div>
    </Link>
  );
}

export function AdminPackCard({ pack, result }: { pack: ApiExamPack; result?: ApiExamPackResults }) {
  return (
    <Link href={`/admin/packs/${pack.slug}`} className="quest-card flex min-h-[165px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{pack.title}</h3>
          <p className="mt-1 text-sm text-muted">{pack.exam_type || "Pack"}</p>
        </div>
        <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "draft"}</Badge>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
        <MiniInfo label="Tests" value={pack.item_count} />
        <MiniInfo label="Usage" value={result?.attempts ?? 0} />
        <MiniInfo label="Avg" value={`${result?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

export function SchoolClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/school/classes/${classroom.slug}`} className="quest-card flex min-h-[160px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{classroom.teacher_name}</p>
        </div>
        <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "No data"}</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {result?.weak_skills[0]?.skill ?? "No weak topic yet"}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.student_count} students</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.assignment_count} assignments</span>
      </div>
    </Link>
  );
}

export function SchoolTeacherCard({ teacher }: { teacher: { id: number; name: string; email: string; teacher_code: string; class_count: number; is_active: boolean } }) {
  return (
    <Link href={`/school/teachers/${teacher.id}`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{teacher.name}</h3>
          <p className="mt-1 text-sm text-muted">{teacher.email || teacher.teacher_code}</p>
        </div>
        <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "active" : "inactive"}</Badge>
      </div>
      <div className="mt-auto pt-4"><MiniInfo label="Classes" value={teacher.class_count} /></div>
    </Link>
  );
}

export function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-surface-soft px-3 py-2">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
    </div>
  );
}

export function EmptyState() {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-white p-6 text-sm text-black/55">Hozircha ma&apos;lumot yo&apos;q.</p>;
}
