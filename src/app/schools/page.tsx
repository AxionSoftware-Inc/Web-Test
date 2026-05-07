import type { Metadata } from "next";

import { schoolsPage } from "@/features/business/model/business-pages";
import { SalesPage } from "@/features/business/ui/sales-page";

export const metadata: Metadata = {
  title: "Schools | QuestLab",
};

export default function Page() {
  return <SalesPage content={schoolsPage} />;
}
