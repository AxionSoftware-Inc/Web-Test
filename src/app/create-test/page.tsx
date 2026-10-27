import type { Metadata } from "next";
import { OpenTestStudio } from "@/features/crud/ui/open-test-studio";

export const metadata: Metadata = {
  title: "Yangi Test Yaratish | QuestLab",
  description: "Matnni qo'ying, fayl yuklang yoki vizual konstruktor orqali o'z testingizni yarating va e'lon qiling.",
};

export default function CreateTestPage() {
  return <OpenTestStudio />;
}
