import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export function BusinessInfoPage({
  eyebrow,
  title,
  copy,
  bullets,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  bullets: string[];
}) {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">{copy}</p>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {bullets.map((item) => (
              <div key={item} className="rounded-xl bg-white/58 p-4 text-sm leading-6 text-black/68">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/subjects/mathematics/topics/algebra" className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
              Try Algebra MVP
            </Link>
            <Link href="/profile" className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">
              View profile
            </Link>
          </div>
        </GlassCard>
      </Container>
    </main>
  );
}
