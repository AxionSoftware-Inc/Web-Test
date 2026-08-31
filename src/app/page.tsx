import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/ui/landing-page";

export const metadata: Metadata = {
  title: "QuestLab — Learn with direction",
  description:
    "Test your understanding, see the skills behind your result, and practice what matters next.",
};

export default function Home() {
  return <LandingPage />;
}
