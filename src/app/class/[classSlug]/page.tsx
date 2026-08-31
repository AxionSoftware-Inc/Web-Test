import type { Metadata } from "next";

import { StudentClassClient } from "@/features/teacher/ui/student-class-client";
import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

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
    <main className="quest-page">
      <Container className="py-8">
        <StudentClassClient classroom={classroom} assignments={assignments} />
      </Container>
    </main>
  );
}
