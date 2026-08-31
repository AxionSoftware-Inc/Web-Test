import Link from "next/link";

import { Container } from "@/shared/ui/container";

export function HeroSection() {
  return (
    <section className="border-b border-black/10 bg-surface-soft">
      <Container className="py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">QuestLab MVP</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Skill-based test platform.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/60">
            Test ishlang, natijani skill bo‘yicha ko‘ring va xatolarni maqsadli mashq bilan tuzating.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/tests" className="rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white">
              Testni boshlash
            </Link>
            <Link href="/subjects" className="rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold">
              Fanlarni ko‘rish
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
