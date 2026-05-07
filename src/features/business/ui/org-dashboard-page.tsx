import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export function OrgDashboardPage({
  eyebrow,
  title,
  copy,
  metrics,
  panels,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  metrics: string[][];
  panels: string[][];
}) {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">{eyebrow}</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">{copy}</p>
        </GlassCard>

        <section className="grid gap-4 py-8 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <GlassCard key={label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </GlassCard>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Weak topics report</h2>
            <div className="mt-5 grid gap-4">
              {panels.map(([title, value]) => (
                <div key={title}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{title}</span>
                    <span>{value}% weak</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-black/10">
                    <div className="h-2 rounded bg-[#8d3d3d]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/tests" className="rounded-xl bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white">Assign test</Link>
              <Link href="/diagnosis" className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-center text-sm font-semibold">View diagnosis model</Link>
              <Link href="/exam-packs" className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-center text-sm font-semibold">Use exam pack</Link>
            </div>
          </GlassCard>
        </section>
      </Container>
    </main>
  );
}
