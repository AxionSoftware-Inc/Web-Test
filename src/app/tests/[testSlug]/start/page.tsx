import { StartTestClient } from "@/features/tests/ui/start-test-client";

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { testSlug } = await params;
  return <StartTestClient testSlug={testSlug} />;
}
