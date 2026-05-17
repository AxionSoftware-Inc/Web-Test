import Link from "next/link";

import { Container } from "@/shared/ui/container";

const stats = [
  ["Flow", "Test -> Result -> Fix"],
  ["For", "Students, teachers, schools"],
  ["Core", "Algebra MVP"],
];

export function HeroSection() {
  return (
    <section className="border-b border-black/10 bg-[#fbfbf6]">
      <Container className="py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">QuestLab MVP</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Skill-based test platform.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/60">
            Test ishlang, natijani skill bo‘yicha ko‘ring, xatoni mistake bankda tuzating. Teacher class va exam pack oqimlari ham bitta platformada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/tests" className="rounded-2xl bg-[#151713] px-6 py-3 text-sm font-semibold text-white">
              Start test
            </Link>
            <Link href="/teacher/classes" className="rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold">
              Teacher module
            </Link>
            <Link href="/exam-packs" className="rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold">
              Exam packs
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-3 rounded-[28px] border border-black/8 bg-white p-3 shadow-[0_18px_55px_rgba(21,23,19,0.06)] md:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#fbfbf6] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/36">{label}</p>
              <p className="mt-2 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
