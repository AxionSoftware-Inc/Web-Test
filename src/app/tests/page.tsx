"use client";

import Link from "next/link";
import { Plus, Sparkles, ArrowLeft } from "lucide-react";

import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";
import { useTranslation } from "@/shared/i18n/i18n-context";

export default function Page() {
  const { t, locale } = useTranslation();

  const text = {
    uz: {
      title: "Testlar maydoni",
      desc: "Yangi test yaratishingiz yoki boshqa bo'limlarga o'tishingiz mumkin.",
      create: "Yangi test yaratish",
      back: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "Тестовая зона",
      desc: "Вы можете создать новый тест или перейти в другие разделы.",
      create: "Создать новый тест",
      back: "Вернуться на главную",
    },
    en: {
      title: "Test Workspace",
      desc: "You can create a new test or navigate to other sections.",
      create: "Create new test",
      back: "Back to Home",
    },
  }[locale];

  return (
    <PremiumPage>
      <PremiumPanel>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Sparkles className="size-7" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-ink">{text.title}</h1>
          <p className="mt-2 max-w-md text-sm text-black/60">
            {text.desc}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create-test"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="size-4" />
              {text.create}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-black/20"
            >
              <ArrowLeft className="size-4" />
              {text.back}
            </Link>
          </div>
        </div>
      </PremiumPanel>
    </PremiumPage>
  );
}
