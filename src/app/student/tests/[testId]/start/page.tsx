import { StartTestClient } from "@/features/tests/ui/start-test-client";

export default async function Page({ params }: { params: Promise<{ testId: string }> }) {
  return <StartTestClient testSlug={(await params).testId} sessionBase="/student/test-session" />;
}
