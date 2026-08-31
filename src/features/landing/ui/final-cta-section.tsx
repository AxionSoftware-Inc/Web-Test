import { ArrowRight, BookOpen, Code2, Mail } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";

const footerLinks = [
  { label: "Tests", href: "/tests" },
  { label: "Subjects", href: "/subjects" },
  { label: "Practice", href: "/practice" },
  { label: "About", href: "/about" },
];

export function FinalCtaSection() {
  return (
    <>
      <section id="start" className="bg-background">
        <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
          <div className="relative overflow-hidden rounded-[28px] bg-brand px-6 py-12 text-center text-white shadow-[0_24px_60px_rgba(39,106,91,0.2)] sm:px-10 sm:py-16">
            <div aria-hidden="true" className="absolute -left-16 -top-20 size-48 rounded-full border-[26px] border-white/10" />
            <div aria-hidden="true" className="absolute -bottom-24 -right-12 size-64 rounded-full border-[34px] border-white/10" />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Your next best question is waiting</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Make the next session count.</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/72 sm:text-base">Start with a focused test and let the results show you where your effort will matter most.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/tests" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-ink hover:bg-[#f7f8f3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">Browse the test library <ArrowRight className="size-4" /></Link>
                <Link href="/subjects" className="inline-flex items-center rounded-xl border border-white/25 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">Explore subjects</Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-line bg-white">
        <Container className="!max-w-[1180px] py-8 sm:py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <Link href="/" className="inline-flex items-center gap-2.5 text-ink">
                <span className="grid size-8 place-items-center rounded-lg bg-ink text-xs font-bold text-white">Q</span>
                <span className="text-sm font-semibold">QuestLab</span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-ink/48">A focused practice platform for understanding what to learn next.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:flex sm:gap-7">
              {footerLinks.map(({ label, href }) => <Link key={href} href={href} className="font-medium text-ink/55 hover:text-brand">{label}</Link>)}
            </div>
            <div className="flex items-center gap-2 text-ink/42">
              <Link aria-label="QuestLab resources" href="/about" className="grid size-9 place-items-center rounded-lg border border-ink/9 hover:border-brand/25 hover:text-brand"><BookOpen className="size-4" /></Link>
              <Link aria-label="QuestLab email" href="mailto:hello@questlab.local" className="grid size-9 place-items-center rounded-lg border border-ink/9 hover:border-brand/25 hover:text-brand"><Mail className="size-4" /></Link>
              <Link aria-label="QuestLab source code" href="https://github.com/AxionSoftware-Inc/Web-Test" className="grid size-9 place-items-center rounded-lg border border-ink/9 hover:border-brand/25 hover:text-brand"><Code2 className="size-4" /></Link>
            </div>
          </div>
          <div className="mt-8 border-t border-ink/8 pt-5 text-xs text-ink/35">© {new Date().getFullYear()} QuestLab. Built for deliberate practice.</div>
        </Container>
      </footer>
    </>
  );
}
