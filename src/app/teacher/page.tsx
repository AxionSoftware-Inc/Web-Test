import type { Metadata } from "next";

import { teacherPage } from "@/features/business/model/business-pages";
import { SalesPage } from "@/features/business/ui/sales-page";

export const metadata: Metadata = {
  title: "Teacher Plan | QuestLab",
};

export default function Page() {
  return <SalesPage content={teacherPage} />;
}
