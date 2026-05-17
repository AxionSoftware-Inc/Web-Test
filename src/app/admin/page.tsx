import type { Metadata } from "next";
import Link from "next/link";

import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Admin | QuestLab",
};

const adminLinks = [
  { title: "Tests CRUD", href: "/crud", copy: "Testlar, savollar, draft/publish." },
  { title: "Classes", href: "/teacher/classes", copy: "Teacher classlar va assignmentlar." },
  { title: "Exam packs", href: "/exam-packs", copy: "Packlar va natijalar." },
  { title: "Mistakes", href: "/mistakes", copy: "Global mistake bank va weak skills." },
];

export default function Page() {
  return (
    <PremiumPage>
      <PremiumPanel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Admin MVP</p>
        <h1 className="mt-3 text-4xl font-semibold">Platform overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
          Authsiz MVP uchun admin workspace. Real permission keyin qo‘shiladi, hozir asosiy modullarga tez kirish beradi.
        </p>
      </PremiumPanel>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminLinks.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.05)] hover:bg-[#fbfbf6]">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/58">{item.copy}</p>
          </Link>
        ))}
      </section>
    </PremiumPage>
  );
}
