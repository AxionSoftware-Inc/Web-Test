import type { Metadata } from "next";

import { TeacherStudentsPage } from "@/features/teacher/ui/teacher-students-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Teacher Students | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const classes = await questApi.classes();
  const [results, rosters] = await Promise.all([
    Promise.all(classes.map((classroom) => questApi.classResults(classroom.slug))),
    Promise.all(classes.map((classroom) => questApi.classStudents(classroom.slug).catch(() => []))),
  ]);

  return <TeacherStudentsPage classes={classes} results={results} rosters={rosters} />;
}
