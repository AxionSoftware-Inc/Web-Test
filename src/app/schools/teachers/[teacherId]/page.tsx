import type { Metadata } from "next";
import { BarChart3, GraduationCap, Mail, UsersRound } from "lucide-react";
import Link from "next/link";

import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage, PremiumPanel, Eyebrow } from "@/shared/ui/premium-shell";

type PageProps = {
  params: Promise<{ teacherId: string }>;
};

export const metadata: Metadata = {
  title: "School Teacher | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps) {
  const { teacherId } = await params;
  const schools = await questApi.schools();
  const school = schools[0];
  if (!school) {
    return <PremiumPage><p className="rounded-3xl bg-white p-8 text-sm text-black/56">School topilmadi.</p></PremiumPage>;
  }
  const teacher = await questApi.schoolTeacher(school.slug, Number(teacherId));
  const classes = await questApi.schoolClasses(school.slug);
  const teacherClasses = classes.filter((item) => teacher.classes.includes(item.id));
  const results = await Promise.all(teacherClasses.map((item) => questApi.classResults(item.slug)));
  const attempts = results.reduce((sum, item) => sum + item.attempts, 0);
  const students = new Set(results.flatMap((item) => item.student_progress.map((student) => student.student_code))).size;
  const average = attempts ? Math.round(results.reduce((sum, item) => sum + item.average_score * item.attempts, 0) / attempts) : 0;

  return (
    <PremiumPage>
      <PremiumPanel>
        <Eyebrow>{school.name}</Eyebrow>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">{teacher.name}</h1>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-black/55"><Mail className="size-4" />{teacher.email || "No email"}</p>
          </div>
          <span className="rounded-2xl bg-[#edf7f3] px-4 py-3 text-sm font-semibold text-[#276a5b]">{teacher.is_active ? "Active" : "Inactive"}</span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric icon={GraduationCap} label="Classes" value={teacherClasses.length} />
          <Metric icon={UsersRound} label="Students" value={students} />
          <Metric icon={BarChart3} label="Attempts" value={attempts} />
          <Metric icon={BarChart3} label="Average" value={`${average}%`} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {teacherClasses.map((item) => (
            <Link key={item.id} href={`/schools/classes/${item.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf8]">
              <p className="text-lg font-semibold">{item.name}</p>
              <p className="mt-2 text-sm text-black/55">{item.description || "No description"}</p>
              <div className="mt-5 flex gap-2 text-xs font-semibold text-black/45"><span>{item.student_count} students</span><span>{item.assignment_count} sessions</span></div>
            </Link>
          ))}
          {!teacherClasses.length ? <p className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-sm text-black/56 md:col-span-2">Bu teacherga hali class bog&apos;lanmagan.</p> : null}
        </div>
      </PremiumPanel>
    </PremiumPage>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-4"><Icon className="size-4 text-[#276a5b]" /><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
