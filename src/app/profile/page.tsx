import type { Metadata } from "next";

import { ProfilePage } from "@/features/profile/ui/profile-page";

export const metadata: Metadata = {
  title: "Profile | QuestLab",
  description: "Learner profile, math progress, test history and skill analytics.",
};

export default function Page() {
  return <ProfilePage />;
}
