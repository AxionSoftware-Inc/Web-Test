import type { Metadata } from "next";
import Link from "next/link";

import { questApi } from "@/shared/api/questlab-api";
import { ShareActions } from "@/shared/ui/share-actions";

type PageProps = {
  params: Promise<{ classSlug: string }>;
};

export const metadata: Metadata = {
  title: "Class Dashboard | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { classSlug } = await params;
  const [classroom, assignments, results] = await Promise.all([
    questApi.classDetail(classSlug),
    questApi.classAssignments(classSlug),
    questApi.classResults(classSlug),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Class dashboard</p>
              <h1 className="mt-2 text-4xl font-semibold">{classroom.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">{classroom.description}</p>
              <p className="mt-3 text-sm font-semibold text-black/52">
                Student link: <Link className="underline" href={`/class/${classroom.slug}`}>/class/{classroom.slug}</Link>
              </p>
            </div>
            <Link href={`/teacher/classes/${classroom.slug}/assign`} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
              Assign test
            </Link>
          </div>
          <div className="mt-5">
            <ShareActions
              url={`/class/${classroom.slug}`}
              exportText={[
                "student,test,score,correct,total",
                ...results.results.map((item) => `${item.student_name},${item.test_title},${item.score},${item.correct},${item.total}`),
              ].join("\n")}
            />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric label="Assignments" value={assignments.length} />
            <Metric label="Attempts" value={results.attempts} />
            <Metric label="Avg score" value={`${results.average_score}%`} />
            <Metric label="Visibility" value={classroom.visibility} />
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[28px] border border-black/8 bg-white/70 p-5">
            <h2 className="text-2xl font-semibold">Assigned tests</h2>
            <div className="mt-4 grid gap-3">
              {assignments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-black/8 bg-white p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-black/52">{item.test_title} / {item.difficulty}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#276a5b]">{item.is_active ? "Active" : "Paused"}</span>
                  </div>
                  <Link href={`/class/${classroom.slug}/assignments/${item.id}`} className="mt-3 inline-block text-sm font-semibold underline">
                    Student start page
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-black/8 bg-[#151713] p-5 text-white">
            <h2 className="text-2xl font-semibold">Weak skills</h2>
            <div className="mt-4 grid gap-3">
              {results.weak_skills.length ? results.weak_skills.map((item) => (
                <div key={item.skill} className="rounded-2xl bg-white/8 p-4">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{item.skill}</span>
                    <span>{item.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-[#8fd6bd]" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-white/65">Results submitted bo‘lsa weak skilllar shu yerda chiqadi.</p>}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/70 p-5">
          <h2 className="text-2xl font-semibold">Student results</h2>
          <div className="mt-4 grid gap-3">
            {results.results.map((item) => (
              <Link key={item.session_id} href={`/results/${item.session_id}`} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf8] md:grid-cols-[1fr_1fr_90px] md:items-center">
                <div>
                  <p className="font-semibold">{item.student_name}</p>
                  <p className="mt-1 text-sm text-black/52">{item.assignment_title || item.test_title}</p>
                </div>
                <p className="text-sm text-black/52">{item.correct}/{item.total} correct</p>
                <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-center text-sm font-semibold text-[#276a5b]">{item.score}%</span>
              </Link>
            ))}
            {!results.results.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Hali submitted natijalar yo‘q.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-[#fbfbf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
