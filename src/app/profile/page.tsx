import type { Metadata } from "next";

import { ProfileClient } from "@/features/profile/ui/profile-client";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Profile | QuestLab",
  description: "Learner profile, math progress, test history and skill analytics.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const summary = await questApi.profileSummary();

  return <ProfileClient initialSummary={summary} />;
}
