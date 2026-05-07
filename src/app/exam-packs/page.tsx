import type { Metadata } from "next";

import { examPacksPage } from "@/features/business/model/business-pages";
import { SalesPage } from "@/features/business/ui/sales-page";

export const metadata: Metadata = {
  title: "Exam Packs | QuestLab",
};

export default function Page() {
  return <SalesPage content={examPacksPage} />;
}
