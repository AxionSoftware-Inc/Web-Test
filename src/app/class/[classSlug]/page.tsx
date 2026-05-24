import type { Metadata } from "next";

import { StudentClassClient } from "@/features/teacher/ui/student-class-client";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ classSlug: string }>;
};

export const metadata: Metadata = {
  title: "Class Tests | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { classSlug } = await params;
  const [classroom, assignments] = await Promise.all([
    questApi.classDetail(classSlug),
    questApi.classAssignments(classSlug),
  ]);

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <StudentClassClient classroom={classroom} assignments={assignments} />
      </div>
    </main>
  );
}
