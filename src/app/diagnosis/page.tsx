import type { Metadata } from "next";

import { BusinessInfoPage } from "@/features/route-hub/ui/business-info-page";

export const metadata: Metadata = {
  title: "Diagnosis Flow | QuestLab",
};

export default function Page() {
  return (
    <BusinessInfoPage
      eyebrow="Diagnosis"
      title="Testdan keyin aniq skill diagnosis"
      copy="Flow: Test -> Result -> Mistake analysis -> Recommended lesson -> Targeted practice -> Retake."
      bullets={[
        "Har savol skilllarga bog'lanadi: formula, prerequisite, interpretation.",
        "Natija faqat score emas, biladigan va bilmaydigan joylar xaritasi bo'ladi.",
        "Userga keyingi lesson va targeted practice avtomatik tavsiya qilinadi.",
        "Retake orqali progress o'lchanadi.",
      ]}
    />
  );
}
