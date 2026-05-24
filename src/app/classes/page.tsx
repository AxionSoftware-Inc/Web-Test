import type { Metadata } from "next";
import Link from "next/link";

import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Public Classes | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const classes = await questApi.classes();

  return (
    <PremiumPage>
      <header className="mb-6 rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Public class catalog</p>
        <h1 className="mt-3 text-4xl font-semibold">Hamma ko‘ra oladigan classlar</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
          Teacher yaratgan public va private classlar shu yerda ko‘rinadi. Private classga kirish uchun join code kerak.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Link key={item.id} href={`/class/${item.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.05)] hover:bg-surface-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-black/50">{item.teacher_name}</p>
              </div>
              <span className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">{item.visibility}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-black/58">{item.description || "No description"}</p>
            <div className="mt-5 flex gap-2 text-xs font-semibold text-black/45">
              <span>{item.assignment_count} tests</span>
              <span>{item.student_count} students</span>
            </div>
          </Link>
        ))}
        {!classes.length ? (
          <PremiumPanel className="md:col-span-2 xl:col-span-3">
            <p className="text-sm text-black/58">Hali classlar yo‘q. Teacher roliga o‘tib class yarating.</p>
          </PremiumPanel>
        ) : null}
      </section>
    </PremiumPage>
  );
}
