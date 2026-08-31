import type { Metadata } from "next";

import { StudentClassClient } from "@/features/teacher/ui/student-class-client";
import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

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
    <main className="quest-page">
      <Container className="py-8">
        <StudentClassClient classroom={classroom} assignments={selected.length ? selected : assignments} />
      </Container>
    </main>
  );
}
