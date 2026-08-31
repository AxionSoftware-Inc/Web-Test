import { ArrowRight, BarChart3, BookOpen, Target } from "lucide-react";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "Start with a real test",
    copy: "Choose a subject and work through focused questions at your level.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "See the skill behind it",
    copy: "Your result is organized by topic and skill, so the gap is easy to name.",
  },
  {
    number: "03",
    icon: Target,
    title: "Practice the right thing",
    copy: "Follow a targeted practice path, then retake to make progress visible.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-background">
      <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="How it works"
            title="A tighter loop between testing and learning."
            copy="A focused workflow keeps the next action visible instead of leaving results in a dead end."
          />
          <span className="hidden items-center gap-2 pb-1 text-sm font-semibold text-brand md:inline-flex">Designed for momentum <ArrowRight className="size-4" /></span>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, copy }, index) => (
            <article key={number} className="group relative rounded-[22px] border border-ink/9 bg-white p-6 shadow-[0_12px_32px_rgba(21,23,19,0.04)] transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" /></span>
                <span className="font-mono text-xs font-semibold text-ink/30">{number}</span>
              </div>
              <h3 className="mt-12 max-w-[220px] text-xl font-semibold tracking-tight text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/58">{copy}</p>
              {index < steps.length - 1 ? <div aria-hidden="true" className="absolute -right-3 top-12 z-10 hidden size-6 items-center justify-center rounded-full border border-ink/8 bg-white text-ink/35 md:flex"><ArrowRight className="size-3.5" /></div> : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
