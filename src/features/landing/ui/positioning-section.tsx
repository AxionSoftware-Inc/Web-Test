import { ArrowRight, Building2, GraduationCap, UserRound } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";

const audiences = [
  { title: "For learners", copy: "Build a habit around understanding, not just finishing a test.", href: "/tests", icon: UserRound },
  { title: "For teachers", copy: "Give every class a shared view of progress and next practice.", href: "/teacher/classes", icon: GraduationCap },
  { title: "For learning centers", copy: "Keep classes, teachers and reports connected in one place.", href: "/schools", icon: Building2 },
];

export function PositioningSection() {
  return (
    <section id="teams" className="bg-background">
      <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative overflow-hidden rounded-[26px] bg-ink p-7 text-white shadow-[0_24px_60px_rgba(21,23,19,0.13)] sm:p-9">
            <div aria-hidden="true" className="absolute -bottom-20 -right-16 size-56 rounded-full border-[28px] border-accent/15" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-accent">One workspace, clear roles</p>
            <h2 className="relative mt-5 max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Progress is easier to act on when everyone sees the same signal.</h2>
            <p className="relative mt-5 max-w-md text-sm leading-6 text-white/62">QuestLab gives learners a next step and gives teams the context to support it.</p>
            <Link href="/about" className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30">Learn about the model <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {audiences.map(({ title, copy, href, icon: Icon }) => (
              <Link key={title} href={href} className="group flex flex-col rounded-[22px] border border-ink/9 bg-white p-5 shadow-[0_12px_32px_rgba(21,23,19,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_18px_42px_rgba(21,23,19,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon className="size-5" /></span>
                <h3 className="mt-8 text-lg font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-ink/55">{copy}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand">Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
