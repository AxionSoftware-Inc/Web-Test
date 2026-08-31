import type { Metadata } from "next";

import { strictPackExample } from "@/features/crud/ui/test-pack-schema";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Pack Schema | QuestLab",
};

export default function Page() {
  return (
    <PremiumPage>
      <PremiumPanel className="mx-auto max-w-5xl p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">QuestLab pack schema</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Strict JSON structure v1.0</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-black/58">
          Pack import qilish uchun JSON aynan shu strukturaga yaqin bo&apos;lishi kerak. `tests` ichidagi har bir test DBga alohida test sifatida saqlanadi va avtomatik packga bog&apos;lanadi.
        </p>
        <pre className="mt-6 max-h-[720px] overflow-auto rounded-3xl border border-black/10 bg-ink p-5 text-xs leading-6 text-white">
          {strictPackExample}
        </pre>
      </PremiumPanel>
    </PremiumPage>
  );
}
