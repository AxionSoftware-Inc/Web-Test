import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Results | QuestLab",
  description: "Test and practice result history.",
};

export default function Page() {
  redirect("/student/home");
}
