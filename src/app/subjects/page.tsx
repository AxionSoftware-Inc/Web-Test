import type { Metadata } from "next";

import { RouteHubPage } from "@/features/route-hub/ui/route-hub-page";

export const metadata: Metadata = {
  title: "Subjects | QuestLab",
};

export default function Page() {
  return (
    <RouteHubPage
      eyebrow="Subject catalog"
      title="Fanlar bo'yicha o'rganish va testga o'tish"
      copy="MVP bosqichida matematika sahifasi tayyor, boshqa fanlar test katalogi orqali ulanadi."
      links={[
        { title: "Mathematics", href: "/subjects/mathematics", copy: "Algebra, calculus va number theory testlari." },
        { title: "Physics", href: "/tests/physics-mechanics-beginner", copy: "Mechanics quick check orqali boshlash." },
        { title: "Programming", href: "/tests/programming-arrays-intermediate", copy: "Arrays va complexity test sessiyasi." },
        { title: "All tests", href: "/tests", copy: "Barcha fanlardagi mavjud testlar katalogi." },
      ]}
    />
  );
}
