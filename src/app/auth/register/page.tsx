import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Register | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Auth"
      title="Register"
      copy="Ro'yxatdan o'tishdan keyingi asosiy qadam onboarding."
      links={[
        { title: "Start onboarding", href: "/auth/onboarding", copy: "Qiziqishlar va maqsadlarni tanlash." },
        { title: "Already have account", href: "/auth/login", copy: "Login sahifasiga o'tish." },
      ]}
    />
  );
}
