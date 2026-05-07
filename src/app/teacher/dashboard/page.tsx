import type { Metadata } from "next";

import { OrgDashboardPage } from "@/features/business/ui/org-dashboard-page";

export const metadata: Metadata = {
  title: "Teacher Dashboard | QuestLab",
};

export default function Page() {
  return (
    <OrgDashboardPage
      eyebrow="Teacher dashboard"
      title="Class analytics demo"
      copy="O'qituvchi uchun fake dashboard: classlar, assigned tests, weak topics va export-ready report."
      metrics={[
        ["Classes", "4"],
        ["Students", "86"],
        ["Assigned tests", "12"],
        ["Avg score", "72%"],
      ]}
      panels={[
        ["Quadratic factoring", "42"],
        ["Function substitution", "35"],
        ["Linear equations", "28"],
        ["Calculation accuracy", "55"],
      ]}
    />
  );
}
