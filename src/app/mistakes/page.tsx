import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mistake Bank | QuestLab",
};

export default function Page() {
  redirect("/student/mistakes");
}
