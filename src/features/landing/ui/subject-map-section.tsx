import { ArrowUpRight, Atom, BookOpen, Code2, Target } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const paths = [
  { title: "Mathematics", copy: "Algebra, calculus and problem solving.", meta: "Build fundamentals", href: "/subjects/mathematics", icon: BookOpen, tone: "bg-brand-soft text-brand" },
  { title: "Physics", copy: "Mechanics and the thinking behind each formula.", meta: "Reason with confidence", href: "/tests/physics-mechanics-beginner", icon: Atom, tone: "bg-[#eef4ff] text-[#315f9f]" },
  { title: "Programming", copy: "Arrays, complexity and practical logic.", meta: "Sharpen your logic", href: "/tests/programming-arrays-intermediate", icon: Code2, tone: "bg-[#fff4e8] text-[#9a5a20]" },
  { title: "Targeted practice", copy: "Return to the skills that need more reps.", meta: "Pick up where you left off", href: "/practice", icon: Target, tone: "bg-[#f1efff] text-[#5b4db7]" },
];

export function SubjectMapSection() {
  return (
    <section id="subjects" className="border-y border-line bg-[#fbfcf7]">
      <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Explore the platform"
            title="Start where your curiosity is."
            copy="Each path is organized around the kind of progress you want to make next."
          />
          <Link href="/tests" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">View all tests <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paths.map(({ title, copy, meta, href, icon: Icon, tone }) => (
            <Link key={title} href={href} className="group flex min-h-[232px] flex-col justify-between rounded-[22px] border border-ink/9 bg-white p-5 shadow-[0_12px_32px_rgba(21,23,19,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_18px_42px_rgba(21,23,19,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">
              <div className="flex items-start justify-between gap-4">
                <span className={"grid size-11 place-items-center rounded-2xl " + tone}><Icon className="size-5" /></span>
                <ArrowUpRight className="size-4 text-ink/25 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/38">{meta}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">{copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
