import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Onboarding | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Onboarding"
      title="Maqsadni tanlang va boshlang"
      copy="Bu sahifa keyin daraja, fanlar va haftalik vaqt savollariga ega bo'ladi."
      links={[
        { title: "Dashboard", href: "/dashboard", copy: "Shaxsiy bosh sahifaga o'tish." },
        { title: "Subjects", href: "/subjects", copy: "Fanlar katalogidan boshlash." },
        { title: "Placement test", href: "/tests", copy: "Darajani test orqali aniqlash." },
      ]}
    />
  );
}
