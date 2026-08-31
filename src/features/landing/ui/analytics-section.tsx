import { ArrowRight, Check, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";

const skillRows = [
  { label: "Equation setup", detail: "Stable", value: 82, color: "bg-brand" },
  { label: "Factoring", detail: "Keep practicing", value: 64, color: "bg-[#b5d9ca]" },
  { label: "Signs & terms", detail: "Priority focus", value: 46, color: "bg-[#e5b957]" },
];

export function AnalyticsSection() {
  return (
    <section id="insights" className="border-t border-line bg-white">
      <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Make progress legible</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">A score tells you where you are. A skill map tells you what to do next.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink/58">Move from a single number to a useful picture of your understanding — topic by topic, attempt by attempt.</p>
            <div className="mt-7 grid gap-3">
              {["See strengths and gaps without extra noise", "Turn mistakes into targeted practice", "Track change with a meaningful retake"].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-ink/68"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Check className="size-3" /></span>{item}</div>
              ))}
            </div>
            <Link href="/diagnosis" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">Explore diagnosis <ArrowRight className="size-4" /></Link>
          </div>

          <div className="rounded-[26px] border border-ink/9 bg-[#f7f8f3] p-3 shadow-[0_18px_48px_rgba(21,23,19,0.07)] sm:p-5">
            <div className="rounded-[20px] border border-ink/8 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/8 pb-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Sample learning signal</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">Quadratic equations</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"><TrendingUp className="size-3.5" /> Moving forward</div>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-end">
                <div className="rounded-2xl bg-ink p-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">Learning focus</p>
                  <p className="mt-3 text-2xl font-semibold">Factoring</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">The next practice set is ready.</p>
                  <div className="mt-8 flex items-end gap-1.5" aria-hidden="true">
                    {[38, 52, 44, 66, 58, 76, 82].map((height, index) => <span key={index} className={"w-2 rounded-full " + (index === 6 ? "bg-accent" : "bg-white/20")} style={{ height }} />)}
                  </div>
                </div>
                <div className="grid gap-4">
                  {skillRows.map(({ label, detail, value, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-ink/68">{label}</span><span className="font-semibold text-ink/40">{detail}</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8"><div className={"h-full rounded-full " + color} style={{ width: value + "%" }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-brand/12 bg-brand-soft px-4 py-3 text-xs">
                <span className="font-medium text-brand">Next: 8 targeted questions</span>
                <ArrowRight className="size-4 text-brand" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
