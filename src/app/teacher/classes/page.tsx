import type { Metadata } from "next";

import { TeacherClassesClient } from "@/features/teacher/ui/teacher-classes-client";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Teacher Classes | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const classes = await questApi.classes();

  return <TeacherClassesClient initialClasses={classes} />;
}
