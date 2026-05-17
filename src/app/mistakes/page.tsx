import type { Metadata } from "next";

import { MistakesClient } from "@/features/mistakes/ui/mistakes-client";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Mistake Bank | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const summary = await questApi.mistakesSummary();

  return <MistakesClient initialSummary={summary} />;
}
