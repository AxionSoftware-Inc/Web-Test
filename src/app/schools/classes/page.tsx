import type { Metadata } from "next";

import { SchoolClassesPage } from "@/features/schools/ui/school-classes-page";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "School Classes | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const schools = await questApi.schools();
  const school = schools[0];
  const [classes, teachers] = school ? await Promise.all([questApi.schoolClasses(school.slug), questApi.schoolTeachers(school.slug)]) : [[], []];

  return (
    <PremiumPage>
      {school ? <SchoolClassesPage school={school} initialClasses={classes} teachers={teachers} /> : <p className="rounded-3xl bg-white p-8 text-sm text-black/56">School topilmadi.</p>}
    </PremiumPage>
  );
}
