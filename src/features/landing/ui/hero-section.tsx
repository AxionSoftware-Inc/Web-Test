import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export function HeroSection() {
  return (
    <section className="border-b border-black/10 bg-[#fcfcf7]">
      <Container className="grid gap-8 pb-12 pt-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
            Mathematics test platform
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl">
            Algebra’dan boshlang. Test ishlang. Progressni ko‘ring.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-black/62">
            Hozirgi MVP matematika, ayniqsa Algebra test flow’ini mukammal qilishga qaratilgan.
            Darajani tanlang, testni boshlang, natijani review qiling.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/subjects/mathematics/topics/algebra"
              className="rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white"
            >
              Open Algebra
            </Link>
            <Link
              href="/test-session/demo-math-quadratic-beginner/question/1"
              className="rounded-xl bg-[#276a5b] px-5 py-3 text-sm font-semibold text-white"
            >
              Start test
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold"
            >
              View profile
            </Link>
          </div>
        </div>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-[#276a5b]">Today</p>
              <h2 className="mt-1 text-2xl font-semibold">Quadratic Basics</h2>
            </div>
            <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">Beginner</span>
          </div>
          <div className="mt-5 grid gap-4">
            <div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Algebra mastery</span>
                <span>68%</span>
              </div>
              <div className="mt-2 h-2 rounded bg-black/10">
                <div className="h-2 w-[68%] rounded bg-[#276a5b]" />
              </div>
            </div>
            <Link href="/subjects/mathematics/topics/algebra" className="rounded-xl bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white">
              Continue
            </Link>
          </div>
        </GlassCard>
      </Container>
    </section>
  );
}
