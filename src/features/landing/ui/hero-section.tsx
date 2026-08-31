import { ArrowRight, Check, CircleDot, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";

function SkillBar({ label, value, tone = "bg-brand" }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-ink/62">
        <span>{label}</span>
        <span className="font-mono text-[10px] text-ink/40">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
        <div className={"h-full rounded-full " + tone} style={{ width: value }} />
      </div>
    </div>
  );
}

function PracticePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] lg:pt-5">
      <div className="landing-preview relative overflow-hidden rounded-[26px] border border-ink/10 bg-white p-3 shadow-[0_28px_80px_rgba(21,23,19,0.15)] sm:p-4">
        <div className="flex items-center justify-between border-b border-ink/8 px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-ink text-[11px] font-bold text-white">Q</span>
            <div>
              <p className="text-xs font-semibold text-ink">Practice workspace</p>
              <p className="mt-0.5 text-[10px] text-ink/42">Your next best question</p>
            </div>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">Live preview</span>
        </div>

        <div className="grid gap-3 p-2 pt-4 sm:grid-cols-[1.35fr_0.8fr]">
          <div className="rounded-2xl bg-[#f7f8f3] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Algebra · 04</p>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-ink">Quadratic equations</h2>
              </div>
              <span className="grid size-8 place-items-center rounded-full border border-brand/20 bg-white text-brand">
                <CircleDot className="size-4" />
              </span>
            </div>
            <p className="mt-6 max-w-[260px] text-sm leading-6 text-ink/68">
              Find the value of x and choose the step that makes the equation simpler.
            </p>
            <div className="mt-5 grid gap-2">
              {["x = 4", "x = 8", "x = 12"].map((option, index) => (
                <div
                  key={option}
                  className={
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium " +
                    (index === 1 ? "border-brand/30 bg-brand-soft text-brand" : "border-ink/8 bg-white text-ink/58")
                  }
                >
                  <span>{option}</span>
                  {index === 1 ? <Check className="size-3.5" /> : <span className="size-3.5 rounded-full border border-ink/15" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div className="rounded-2xl border border-ink/8 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">Skill map</p>
                <Sparkles className="size-4 text-brand" />
              </div>
              <div className="mt-5 grid gap-4">
                <SkillBar label="Equation setup" value="82%" />
                <SkillBar label="Factoring" value="64%" tone="bg-[#b5d9ca]" />
                <SkillBar label="Signs & terms" value="46%" tone="bg-[#e5b957]" />
              </div>
            </div>
            <div className="rounded-2xl bg-ink p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Next step</p>
              <p className="mt-2 text-sm font-semibold">Review factoring before your retake.</p>
              <div className="mt-4 flex items-center justify-between text-[10px] text-white/55">
                <span>Targeted practice</span>
                <ArrowRight className="size-3.5 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-0 hidden items-center gap-2 rounded-2xl border border-brand/15 bg-white px-3 py-2.5 shadow-[0_16px_40px_rgba(21,23,19,0.12)] sm:flex lg:-right-6">
        <span className="grid size-7 place-items-center rounded-xl bg-brand-soft text-brand"><Check className="size-4" /></span>
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40">Feedback loop</span>
          <span className="mt-0.5 block text-xs font-semibold text-ink">Practice with purpose</span>
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="home" className="relative isolate overflow-hidden border-b border-line bg-[#fbfcf7]">
      <div aria-hidden="true" className="landing-grid absolute inset-0 opacity-70" />
      <div aria-hidden="true" className="landing-orb absolute -right-32 -top-32 size-[420px] rounded-full bg-[#dff3e8] blur-3xl" />
      <Container className="relative !max-w-[1180px] py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand shadow-sm">
              <span className="size-1.5 rounded-full bg-brand" />
              Skill-based learning workspace
            </div>
            <h1 className="mt-6 max-w-[650px] text-[clamp(2.9rem,6vw,5.7rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-ink">
              Know what to practice next.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-ink/62 sm:text-lg sm:leading-8">
              QuestLab turns every test into a clear learning path: see the skill behind your result, fix the gap, and return stronger.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/tests" className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(21,23,19,0.16)] hover:bg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">
                Explore the test library
                <ArrowRight className="size-4" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center rounded-xl border border-ink/12 bg-white/75 px-5 py-3.5 text-sm font-semibold text-ink hover:border-brand/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">
                See how it works
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-ink/48">
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-brand" />Structured practice</span>
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-brand" />Skill-level feedback</span>
            </div>
          </div>
          <PracticePreview />
        </div>
      </Container>
    </section>
  );
}
