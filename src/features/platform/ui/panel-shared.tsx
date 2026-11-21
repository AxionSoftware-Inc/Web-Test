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
  const schools = await questApi.schools().catch(() => []);
  if (schools.length > 0 && schools[0]) return schools[0];
  try {
    const created = await questApi.createSchool({
      name: "Demo O'quv Markazi",
      slug: "demo-center",
      owner_name: "QuestLab Admin",
      manage_code: "admin123",
      visibility: "public",
      description: "Asosiy demo o'quv markazi",
      portal_subdomain: "demo-center",
      portal_domain: "",
      logo_url: "",
      primary_color: "#276a5b",
      accent_color: "#8fd6bd",
      student_invite_code: "DEMO-ST",
    });
    return created;
  } catch {
    return {
      id: 1,
      name: "Demo O'quv Markazi",
      slug: "demo-center",
      owner_name: "QuestLab Admin",
      visibility: "public",
      description: "Asosiy demo o'quv markazi",
      portal_subdomain: "demo-center",
      portal_domain: "",
      logo_url: "",
      primary_color: "#276a5b",
      accent_color: "#8fd6bd",
      student_invite_code: "DEMO-ST",
      teacher_count: 0,
    } as ApiSchool;
  }
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
    <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={`${card.href}-${card.title}`}
          href={card.href}
          className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-4.5 shadow-sm transition hover:border-black/20 hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink group-hover:text-brand transition-colors">
                  <LatexText text={card.title} />
                </h3>
                {card.meta ? <p className="mt-1 text-xs text-black/50"><LatexText text={card.meta} /></p> : null}
              </div>
              {card.status ? (
                <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                  {card.status}
                </span>
              ) : null}
            </div>
            {card.copy ? <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-black/60"><LatexText text={card.copy} /></p> : null}
          </div>
          {card.stats?.length ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {card.stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="rounded-xl bg-[#fafaf8] border border-black/4 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-ink"><LatexText text={String(stat.value)} /></p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-black/40">{stat.label}</p>
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
    <Link href={`/teacher/classes/${result.classroom.slug}`} className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-semibold text-ink group-hover:text-brand transition-colors">{result.classroom.name}</h3>
            <p className="mt-1 text-xs text-black/50">{result.students_submitted}/{result.students_total || result.students_submitted} topshirdi</p>
          </div>
          <Badge variant={result.average_score >= 70 ? "success" : "warning"}>{result.average_score}%</Badge>
        </div>
      </div>
      <p className="mt-3 line-clamp-1 text-xs text-black/55">Kuchsiz mavzu: {weakSkill?.skill ?? "Ma'lumot yo'q"}</p>
    </Link>
  );
}

export function CreatorPackSummary({ pack, usage }: { pack: ApiExamPack; usage?: ApiExamPackResults }) {
  return (
    <Link href={`/creator/packs/${pack.slug}`} className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-semibold text-ink group-hover:text-brand transition-colors">{pack.title}</h3>
            <p className="mt-1 text-xs text-black/50">{pack.exam_type || "Pack"} · {pack.item_count} ta test</p>
          </div>
          <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "inactive"}</Badge>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <MiniInfo label="Topshirildi" value={usage?.attempts ?? 0} />
        <MiniInfo label="O'quvchilar" value={usage?.students_submitted ?? 0} />
        <MiniInfo label="O'rtacha" value={`${usage?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

export function CreatorTestRow({ test, href }: { test: ApiTest; href: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-white p-3 shadow-sm transition hover:border-black/20">
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-brand transition-colors">{test.title}</p>
        <p className="mt-0.5 text-xs text-black/50">{test.subject_slug} · {test.topic_slug} · {test.test_questions.length} savol</p>
      </div>
      <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
    </Link>
  );
}

export function CreatorTestCard({ test }: { test: ApiTest }) {
  return (
    <Link href={`/creator/tests/${test.slug}/edit`} className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{test.title}</h3>
            <p className="mt-1 text-xs text-black/50">{test.subject_slug} · {test.topic_slug}</p>
          </div>
          <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-black/55">
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{test.test_questions.length} savol</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{test.estimated_minutes} daqiqa</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{test.difficulty}</span>
      </div>
    </Link>
  );
}

export function GenericEntityCard({ title, href, meta, copy, stats = [], status }: Card) {
  return <QuestEntityCard title={<LatexText text={title} />} href={href} meta={meta ? <LatexText text={meta} /> : copy ? <LatexText text={copy} /> : undefined} status={status} stats={stats.map((stat) => `${stat.label}: ${stat.value}`)} />;
}

export function AdminSchoolCard({ school }: { school: ApiSchool }) {
  return (
    <Link href={`/admin/schools/${school.slug}`} className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{school.name}</h3>
            <p className="mt-0.5 text-xs text-black/50">{school.owner_name || "Owner yo'q"}</p>
          </div>
          <Badge variant={school.visibility === "public" ? "success" : "default"}>{school.visibility}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/60">{school.description || school.portal_domain || school.portal_subdomain || "Tavsif yo'q"}</p>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <MiniInfo label="O'qituvchilar" value={school.teacher_count} />
        <MiniInfo label="Invite" value={school.student_invite_code ? "Faol" : "Yo'q"} />
      </div>
    </Link>
  );
}

export function AdminClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/admin/classes/${classroom.slug}`} className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{classroom.name}</h3>
            <p className="mt-0.5 text-xs text-black/50">{classroom.teacher_name}</p>
          </div>
          <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "Yo'q"}</Badge>
        </div>
        <p className="mt-2 line-clamp-1 text-xs text-black/55">Kuchsiz: {result?.weak_skills[0]?.skill ?? "Mavjud emas"}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-black/55">
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{classroom.student_count} o&apos;quvchi</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{classroom.assignment_count} vazifa</span>
      </div>
    </Link>
  );
}

export function AdminTestCard({ test, used }: { test: ApiTest; used: number }) {
  return (
    <Link href={`/admin/tests/${test.slug}`} className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{test.title}</h3>
            <p className="mt-0.5 text-xs text-black/50">{test.subject_slug} · {test.topic_slug}</p>
          </div>
          <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-black/55">
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{test.test_questions.length} savol</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{used} vazifa</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{test.difficulty}</span>
      </div>
    </Link>
  );
}

export function AdminPackCard({ pack, result }: { pack: ApiExamPack; result?: ApiExamPackResults }) {
  return (
    <Link href={`/admin/packs/${pack.slug}`} className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{pack.title}</h3>
            <p className="mt-0.5 text-xs text-black/50">{pack.exam_type || "Pack"}</p>
          </div>
          <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "draft"}</Badge>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <MiniInfo label="Testlar" value={pack.item_count} />
        <MiniInfo label="Topshirildi" value={result?.attempts ?? 0} />
        <MiniInfo label="O'rtacha" value={`${result?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

export function SchoolClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/school/classes/${classroom.slug}`} className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{classroom.name}</h3>
            <p className="mt-0.5 text-xs text-black/50">{classroom.teacher_name}</p>
          </div>
          <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "Yo'q"}</Badge>
        </div>
        <p className="mt-2 line-clamp-1 text-xs text-black/55">Kuchsiz: {result?.weak_skills[0]?.skill ?? "Mavjud emas"}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-black/55">
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{classroom.student_count} o&apos;quvchi</span>
        <span className="rounded-lg bg-[#fafaf8] border border-black/4 px-2 py-0.5">{classroom.assignment_count} vazifa</span>
      </div>
    </Link>
  );
}

export function SchoolTeacherCard({ teacher }: { teacher: { id: number; name: string; email: string; teacher_code: string; class_count: number; is_active: boolean } }) {
  return (
    <Link href={`/school/teachers/${teacher.id}`} className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{teacher.name}</h3>
            <p className="mt-0.5 text-xs text-black/50">{teacher.email || teacher.teacher_code}</p>
          </div>
          <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "active" : "inactive"}</Badge>
        </div>
      </div>
      <div className="mt-3">
        <MiniInfo label="Sinflar soni" value={teacher.class_count} />
      </div>
    </Link>
  );
}

export function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[#fafaf8] border border-black/4 px-3 py-2 text-center">
      <p className="text-sm font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
    </div>
  );
}

export function EmptyState() {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-[#fafaf8] p-6 text-center text-sm text-black/55">Hozircha ma&apos;lumot yo&apos;q.</p>;
}
