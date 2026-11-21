import type { Metadata } from "next";
import { ArrowRight, Building2, CheckCircle2, Palette, UsersRound } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";

export const metadata: Metadata = {
  title: "School Pricing | QuestLab",
};

const plans = [
  {
    title: "Kichik markaz",
    price: "500 000 so'm / oy",
    copy: "100 tagacha o'quvchi, brendli portal, o'qituvchilar monitoringi va asosiy tahlillar.",
    href: "/schools/dashboard",
  },
  {
    title: "O'suvchi markaz",
    price: "1 500 000 so'm / oy",
    copy: "500 tagacha o'quvchi, sinflar tahlili, kuchsiz mavzular hisoboti va oylik eksport.",
    href: "/schools/dashboard",
  },
  {
    title: "Katta markaz / Tarmoq",
    price: "3 000 000 so'm / oy",
    copy: "Maxsus domen, logo va ranglar, kengaytirilgan tahlillar, ustuvor qo'llab-quvvatlash.",
    href: "/schools/dashboard",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-8">
        <section className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-stretch">
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">O&apos;quv markaz tarifi</p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold leading-snug tracking-tight text-ink md:text-3xl">
              O&apos;quv markaz uchun bitta hisob, barcha o&apos;qituvchi va o&apos;quvchilar natijalari bir joyda
            </h1>
            <p className="mt-3 max-w-xl text-xs leading-5 text-black/60">
              Markaz sinf ochmaydi. Markaz o&apos;qituvchilarni qo&apos;shadi, ularning sinflarini biriktiradi va umumiy natijalar, hisobotlar hamda brendli portalni boshqaradi.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/schools/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">
                Markaz boshqaruv paneli
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href="/teacher/classes" className="rounded-xl border border-black/8 bg-[#fafaf8] px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-black/20">
                O&apos;qituvchi sinflari
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40">Tariflar diapazoni</p>
              <h2 className="mt-1 text-xl font-bold text-ink">500 000 - 3 000 000 so&apos;m / oy</h2>
            </div>
            <div className="mt-4 grid gap-2">
              <Mini icon={Building2} label="Portal" value="White-label" />
              <Mini icon={UsersRound} label="Hisoblar" value="O'qituvchilar + o'quvchilar" />
              <Mini icon={Palette} label="Brendlash" value="Logo + ranglar" />
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.title} className="flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-5 shadow-sm transition hover:border-black/20">
              <div>
                <div className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                  <CheckCircle2 className="size-4" />
                </div>
                <h2 className="mt-3.5 text-base font-bold text-ink">{plan.title}</h2>
                <p className="mt-2 text-xl font-bold text-ink">{plan.price}</p>
                <p className="mt-2 text-xs leading-5 text-black/60">{plan.copy}</p>
              </div>
              <Link href={plan.href} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/8 bg-[#fafaf8] px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-black/20">
                Boshlash
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </section>
      </Container>
    </main>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/4 bg-[#fafaf8] p-2.5 text-xs">
      <span className="inline-flex items-center gap-1.5 text-black/55">
        <Icon className="size-3.5 text-brand" />
        {label}
      </span>
      <strong className="font-semibold text-ink">{value}</strong>
    </div>
  );
}
