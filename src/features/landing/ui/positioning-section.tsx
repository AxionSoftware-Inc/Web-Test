import Link from "next/link";
import { BookOpenCheck, Building2, GraduationCap, Languages, RotateCcw, SearchCheck, Target } from "lucide-react";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

const diagnosisFlow = [
  ["Test", "User solves skill-tagged questions."],
  ["Result", "Score is broken down by skill and topic."],
  ["Mistake analysis", "Wrong answers reveal exact weak skills."],
  ["Recommended lesson", "Platform suggests the next explanation."],
  ["Targeted practice", "User fixes the weak skill directly."],
  ["Retake", "Progress is measured again."],
];

const businessCards = [
  {
    title: "Teacher / Tutor plan",
    href: "/teacher",
    icon: GraduationCap,
    copy: "Class, assigned tests, student results, weak topic report and PDF/export.",
    price: "99 000 - 299 000 so'm / oy",
  },
  {
    title: "School / Learning center",
    href: "/schools",
    icon: Building2,
    copy: "Branded portal, student dashboard, teacher analytics and monthly reports.",
    price: "500 000 - 3 000 000 so'm / oy",
  },
  {
    title: "Exam packs",
    href: "/exam-packs",
    icon: BookOpenCheck,
    copy: "DTM Math, SAT Math, university linear algebra and Python interview packs.",
    price: "49 000 - 199 000 so'm",
  },
];

export function PositioningSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7f2]">
      <Container className="py-14">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
              Positioning
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Faqat test emas — bilimdagi bo‘shliqni topib, tuzatadigan platforma.
            </h2>
            <p className="mt-4 text-sm leading-6 text-black/62">
              Har savol skillga bog‘lanadi. Natijadan keyin platforma user nimani bilishi,
              nimani bilmasligi, nega xato qilgani va keyin nimani o‘rganishi kerakligini ko‘rsatadi.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniPoint icon={<SearchCheck className="size-5" />} title="Visual diagnosis" />
              <MiniPoint icon={<Target className="size-5" />} title="Skill-based result" />
              <MiniPoint icon={<RotateCcw className="size-5" />} title="Retake loop" />
              <MiniPoint icon={<Languages className="size-5" />} title="Multi-language ready" />
            </div>
            <Link href="/diagnosis" className="mt-6 inline-block rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
              Explore diagnosis flow
            </Link>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-xl font-semibold">Learning loop</h3>
            <div className="mt-5 grid gap-3">
              {diagnosisFlow.map(([title, copy], index) => (
                <div key={title} className="flex gap-3 rounded-xl bg-white/55 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#151713] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-black/55">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {businessCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href}>
                <GlassCard className="h-full p-5">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#edf7f3] text-[#276a5b]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/60">{card.copy}</p>
                  <p className="mt-5 rounded-xl bg-[#151713] px-3 py-2 text-sm font-semibold text-white">{card.price}</p>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function MiniPoint({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/55 p-3 text-sm font-semibold">
      <span className="text-[#276a5b]">{icon}</span>
      {title}
    </div>
  );
}
