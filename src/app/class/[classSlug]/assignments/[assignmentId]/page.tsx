import type { Metadata } from "next";

import { StudentClassClient } from "@/features/teacher/ui/student-class-client";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ classSlug: string; assignmentId: string }>;
};

export const metadata: Metadata = {
  title: "Start Class Assignment | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { classSlug, assignmentId } = await params;
  const [classroom, assignments] = await Promise.all([
    questApi.classDetail(classSlug),
    questApi.classAssignments(classSlug),
  ]);
  const selected = assignments.filter((item) => String(item.id) === assignmentId);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <StudentClassClient classroom={classroom} assignments={selected.length ? selected : assignments} />
      </div>
    </main>
  );
}
