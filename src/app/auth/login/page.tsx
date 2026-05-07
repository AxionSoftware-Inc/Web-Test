import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Login | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Auth"
      title="Login"
      copy="Auth UI keyingi bosqichda form va providerlar bilan to'ldiriladi."
      links={[
        { title: "Go to dashboard", href: "/dashboard", copy: "Demo dashboardni ochish." },
        { title: "Create account", href: "/auth/register", copy: "Register sahifasiga o'tish." },
      ]}
    />
  );
}
