import type { Metadata } from "next";

import { ProfilePage } from "@/features/profile/ui/profile-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Profile | QuestLab",
  description: "Learner profile, math progress, test history and skill analytics.",
};

export default async function Page() {
  const summary = await questApi.profileSummary();

  return <ProfilePage summary={summary} />;
}
