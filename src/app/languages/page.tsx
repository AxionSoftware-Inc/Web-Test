import type { Metadata } from "next";

import { supportedLocales, localizationPlan } from "@/features/localization/model/localization-content";
import { LanguageDemo } from "@/features/localization/ui/language-demo";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export const metadata: Metadata = {
  title: "Languages | QuestLab",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
            Multi-language
          </p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">Ko&apos;p tilli platforma modeli</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
            Backenddan oldin UI va content dictionary bilan boshlash mumkin. Keyin real DB modelga locale-aware content qo&apos;shiladi.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {supportedLocales.map((locale) => (
              <div key={locale.code} className="rounded-xl bg-white/58 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">{locale.code}</p>
                <h2 className="mt-2 text-xl font-semibold">{locale.name}</h2>
                <p className="mt-2 text-sm font-semibold text-black/50">{locale.status}</p>
                <p className="mt-3 text-sm leading-6 text-black/60">{locale.scope}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3">
            {localizationPlan.map((item) => (
              <div key={item} className="rounded-xl bg-white/58 p-4 text-sm leading-6 text-black/68">
                {item}
              </div>
            ))}
          </div>
          <LanguageDemo />
        </GlassCard>
      </Container>
    </main>
  );
}
