import type { Metadata } from "next";
import { ArrowRight, Building2, CheckCircle2, Palette, UsersRound } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export const metadata: Metadata = {
  title: "School Pricing | QuestLab",
};

const plans = [
  {
    title: "Small center",
    price: "500 000 so'm / oy",
    copy: "100 tagacha student, branded portal, teacher monitoring va basic analytics.",
    href: "/schools/dashboard",
  },
  {
    title: "Growth",
    price: "1 500 000 so'm / oy",
    copy: "500 tagacha student, teacher/class analytics, weak topic reports va monthly export.",
    href: "/schools/dashboard",
  },
  {
    title: "Enterprise",
    price: "3 000 000 so'm / oy",
    copy: "Custom domain, logo/colors, advanced reports, priority setup va white-label flow.",
    href: "/schools/dashboard",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <GlassCard className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">School plan</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              O&apos;quv markaz uchun bitta account, barcha teacher va student natijalari bir joyda
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
              School class ochmaydi. School teacherlarni qo&apos;shadi, teacher classlarini bog&apos;laydi va umumiy analytics, reports, branded portalni boshqaradi.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/schools/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
                Open school dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/teacher/classes" className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">
                Teacher classes
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-black/50">Pricing range</p>
            <h2 className="mt-2 text-3xl font-semibold">500 000 - 3 000 000 so&apos;m / oy</h2>
            <div className="mt-6 grid gap-3">
              <Mini icon={Building2} label="Portal" value="White-label" />
              <Mini icon={UsersRound} label="Accounts" value="Teachers + students" />
              <Mini icon={Palette} label="Branding" value="Logo + colors" />
            </div>
          </GlassCard>
        </section>

        <section id="pricing" className="mt-6 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <GlassCard key={plan.title} className="p-5">
              <div className="grid size-11 place-items-center rounded-xl bg-[#edf7f3] text-[#276a5b]">
                <CheckCircle2 className="size-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">{plan.title}</h2>
              <p className="mt-4 text-3xl font-semibold">{plan.price}</p>
              <p className="mt-3 text-sm leading-6 text-black/60">{plan.copy}</p>
              <Link href={plan.href} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold">
                Start setup
                <ArrowRight className="size-4" />
              </Link>
            </GlassCard>
          ))}
        </section>
      </Container>
    </main>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/58 p-3 text-sm">
      <span className="inline-flex items-center gap-2 text-black/55">
        <Icon className="size-4 text-[#276a5b]" />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
