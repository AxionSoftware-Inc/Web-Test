import type { Metadata } from "next";

import { TeacherStudentsPage } from "@/features/teacher/ui/teacher-students-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Teacher Students | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const classes = await questApi.classes();
  const results = await Promise.all(classes.map((classroom) => questApi.classResults(classroom.slug)));

  return <TeacherStudentsPage classes={classes} results={results} />;
}
