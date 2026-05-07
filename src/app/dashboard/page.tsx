import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Dashboard | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="User dashboard"
      title="Davom ettirish, testlar va natijalar"
      copy="Dashboard hozircha foydalanuvchini eng muhim MVP flowlarga tez olib boradigan hub sifatida ishlaydi."
      links={[
        { title: "Continue with tests", href: "/tests", copy: "Yangi test sessiyasini boshlash." },
        { title: "Recent results", href: "/results", copy: "Natijalar va question reviewlarni ko'rish." },
        { title: "Practice", href: "/practice", copy: "Zaif mavzularni qayta ishlash." },
      ]}
    />
  );
}
