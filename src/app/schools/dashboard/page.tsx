import type { Metadata } from "next";

import { OrgDashboardPage } from "@/features/business/ui/org-dashboard-page";

export const metadata: Metadata = {
  title: "School Dashboard | QuestLab",
};

export default function Page() {
  return (
    <OrgDashboardPage
      eyebrow="School dashboard"
      title="Learning center analytics demo"
      copy="O'quv markaz uchun fake dashboard: branches, teachers, students, exam preparation va monthly report."
      metrics={[
        ["Branches", "2"],
        ["Teachers", "14"],
        ["Students", "420"],
        ["Monthly growth", "+18%"],
      ]}
      panels={[
        ["DTM Algebra", "38"],
        ["Geometry basics", "46"],
        ["Exam timing", "31"],
        ["Careless mistakes", "52"],
      ]}
    />
  );
}
