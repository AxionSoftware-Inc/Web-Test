import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Practice | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Practice"
      title="Mashq qilish uchun tez yo'nalishlar"
      copy="Practice engine keyingi bosqichda alohida session sifatida kengayadi. Hozir test va review flow bilan bog'langan."
      links={[
        { title: "Algebra practice", href: "/tests/math-quadratic-beginner", copy: "Quadratic basics orqali mashqni boshlash." },
        { title: "Calculus practice", href: "/tests/math-calculus-intermediate", copy: "Derivative fundamentals testiga o'tish." },
        { title: "Mistake review", href: "/results", copy: "Natijalar orqali zaif joylarni ko'rish." },
      ]}
    />
  );
}
