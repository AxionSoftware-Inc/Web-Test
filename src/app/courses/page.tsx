import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Courses | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Courses"
      title="Kurslar uchun boshlang'ich katalog"
      copy="Course workspace keyin lesson va module route'lariga ulanadi. Hozir eng yaqin test va subject sahifalariga yo'naltiradi."
      links={[
        { title: "Mathematics path", href: "/subjects/mathematics", copy: "Matematika fan sahifasidan boshlash." },
        { title: "Test-first path", href: "/tests", copy: "Avval test yechib darajani aniqlash." },
      ]}
    />
  );
}
