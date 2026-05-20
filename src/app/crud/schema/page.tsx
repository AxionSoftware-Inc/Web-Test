import type { Metadata } from "next";

import { strictPackExample } from "@/features/crud/ui/test-pack-schema";

export const metadata: Metadata = {
  title: "Pack Schema | QuestLab",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">QuestLab pack schema</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Strict JSON structure v1.0</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-black/58">
            Pack import qilish uchun JSON aynan shu strukturaga yaqin bo&apos;lishi kerak. `tests` ichidagi har bir test DBga alohida test sifatida saqlanadi va avtomatik packga bog&apos;lanadi.
          </p>
          <pre className="mt-6 max-h-[720px] overflow-auto rounded-3xl border border-black/10 bg-[#151713] p-5 text-xs leading-6 text-white">
            {strictPackExample}
          </pre>
        </section>
      </div>
    </main>
  );
}
