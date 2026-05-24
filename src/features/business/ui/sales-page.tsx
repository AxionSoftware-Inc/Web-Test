import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

type SalesPageContent = {
  eyebrow: string;
  title: string;
  copy: string;
  price: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  stats: string[][];
  workflow: string[][];
  features: Array<[string, string, LucideIcon]>;
  pricing: string[][];
};

export function SalesPage({ content }: { content: SalesPageContent }) {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <section className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-stretch">
          <GlassCard className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">{content.copy}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={content.primaryHref} className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
                {content.primaryLabel}
              </Link>
              <Link href={content.secondaryHref} className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">
                {content.secondaryLabel}
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-black/50">Pricing range</p>
            <h2 className="mt-2 text-3xl font-semibold">{content.price}</h2>
            <div className="mt-6 grid gap-3">
              {content.stats.map(([label, value]) => (
                <div key={label} className="flex justify-between rounded-xl bg-white/58 p-3 text-sm">
                  <span className="text-black/55">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-5 py-5 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="p-5">
            <h2 className="text-2xl font-semibold">How it works</h2>
            <div className="mt-5 grid gap-3">
              {content.workflow.map(([title, copy], index) => (
                <div key={title} className="flex gap-3 rounded-xl bg-white/58 p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-black/60">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-5 md:grid-cols-2">
            {content.features.map(([title, copy, Icon]) => (
              <GlassCard key={title} className="p-5">
                <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/60">{copy}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="pricing" className="pb-10">
          <div id="packs" className="grid gap-5 md:grid-cols-3">
            {content.pricing.map(([title, price, copy]) => (
              <GlassCard key={title} className="p-5">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-4 text-3xl font-semibold">{price}</p>
                <p className="mt-3 text-sm leading-6 text-black/60">{copy}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
