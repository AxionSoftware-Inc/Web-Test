import type { Metadata } from "next";
import { ModuleSettingsClient } from "@/features/platform/ui/module-settings-client";

export const metadata: Metadata = {
  title: "Modullar Boshqaruvi | QuestLab",
  description: "Mustaqil modullarni yoqish, o'chirish va alohida konfiguratsiyalarni sozlash.",
};

export default function ModulesSettingsPage() {
  return <ModuleSettingsClient />;
}
