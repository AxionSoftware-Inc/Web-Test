import type { Metadata } from "next";

import { SchoolTeachersPage } from "@/features/schools/ui/school-teachers-page";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "School Teachers | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const schools = await questApi.schools();
  const school = schools[0];
  const [teachers, classes] = school ? await Promise.all([questApi.schoolTeachers(school.slug), questApi.schoolClasses(school.slug)]) : [[], []];

  return (
    <PremiumPage>
      {school ? <SchoolTeachersPage school={school} initialTeachers={teachers} classes={classes} /> : <p className="rounded-3xl bg-white p-8 text-sm text-black/56">School topilmadi.</p>}
    </PremiumPage>
  );
}
