import type { Metadata } from "next";

import { SchoolDashboardClient } from "@/features/schools/ui/school-dashboard-client";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "School Dashboard | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [schools, classes] = await Promise.all([
    questApi.schools(),
    questApi.classes(),
  ]);

  return <SchoolDashboardClient initialSchools={schools} classes={classes} />;
}
