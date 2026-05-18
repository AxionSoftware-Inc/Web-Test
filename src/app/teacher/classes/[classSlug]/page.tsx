import type { Metadata } from "next";

import { TeacherClassDashboard } from "@/features/teacher/ui/teacher-class-dashboard";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ classSlug: string }>;
};

export const metadata: Metadata = {
  title: "Class Dashboard | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { classSlug } = await params;
  const [classroom, assignments, results, tests] = await Promise.all([
    questApi.classDetail(classSlug),
    questApi.classAssignments(classSlug),
    questApi.classResults(classSlug),
    questApi.tests(),
  ]);

  return <TeacherClassDashboard classroom={classroom} initialAssignments={assignments} results={results} tests={tests} />;
}
