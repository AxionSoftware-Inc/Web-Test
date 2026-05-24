import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export const metadata: Metadata = {
  title: "Algebra Practice | QuestLab",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Practice</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">Algebra practice hub</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
            Choose a focused drill. Practice is not a final test: hints, retry and explanations can be added here before backend.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Quadratic factoring", "/practice/algebra/targeted", "Weak-skill drill from diagnosis."],
              ["Linear equations", "/learn/algebra-foundations/linear-equations/solving-basics", "Review then practice."],
              ["Function substitution", "/learn/algebra-foundations/functions/substitution", "Input/output accuracy."],
            ].map(([title, href, copy]) => (
              <Link key={title} href={href} className="rounded-xl bg-white/58 p-4">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">{copy}</p>
              </Link>
            ))}
          </div>
        </GlassCard>
      </Container>
    </main>
  );
}
