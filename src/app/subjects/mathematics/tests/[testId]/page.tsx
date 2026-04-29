import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { mathematicsTests } from "@/features/subjects/mathematics/model/mathematics-content";
import { MathematicsTestPage } from "@/features/subjects/mathematics/ui/mathematics-test-page";

type PageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export async function generateStaticParams() {
  return mathematicsTests.map((test) => ({
    testId: test.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { testId } = await params;
  const test = mathematicsTests.find((item) => item.id === testId);

  if (!test) {
    return {
      title: "Mathematics Test | QuestLab",
    };
  }

  return {
    title: `${test.title} | QuestLab`,
    description: `${test.category} ${test.difficulty} mathematics test.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  const test = mathematicsTests.find((item) => item.id === testId);

  if (!test) {
    notFound();
  }

  return <MathematicsTestPage test={test} />;
}
