import type { ModuleManifest } from "../kernel/types";

export interface CreatorModuleConfig extends Record<string, unknown> {
  allowDirectPublish: boolean;
  maxActiveTests: number;
  enableMarkdownImport: boolean;
  enableLaTeXAssistant: boolean;
}

export const creatorManifest: ModuleManifest<CreatorModuleConfig> = {
  id: "creator",
  name: "Creator & Test Muallifi Moduli",
  tagline: "Savollar, testlar va test paketlari yaratish studiyasi",
  description: "Mustaqil kontent yaratuvchi o'qituvchi va repetitorlar uchun testlar, savollar banki va paketlar yaratish.",
  version: "2.0.0",
  category: "content",
  iconName: "BookOpenCheck",
  defaultEnabled: true,
  routePrefixes: ["/creator"],
  defaultSettings: {
    allowDirectPublish: true,
    maxActiveTests: 100,
    enableMarkdownImport: true,
    enableLaTeXAssistant: true,
  },
  settingsSchema: [
    {
      key: "allowDirectPublish",
      label: "To'g'ridan-to'g'ri nashr qilish",
      description: "Moderatsiyasiz to'g'ridan-to'g'ri e'lon qilishga ruxsat",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "maxActiveTests",
      label: "Maksimal faol testlar soni",
      description: "Bitta muallif yaratishi mumkin bo'lgan maksimal testlar",
      type: "number",
      defaultValue: 100,
      min: 5,
      max: 1000,
    },
    {
      key: "enableLaTeXAssistant",
      label: "LaTeX formula ko'makchisi",
      description: "Savol kiritishda matematik formulalar asboblarini ko'rsatish",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [
    { id: "creator-home", label: "Home", href: "/creator/home", iconName: "Home", roles: ["creator"] },
    { id: "creator-add-pack", label: "Add Pack", href: "/creator/add-pack", iconName: "Plus", roles: ["creator"] },
    { id: "creator-packs", label: "Packs", href: "/creator/packs", iconName: "PackageCheck", roles: ["creator"] },
    { id: "creator-tests", label: "Tests", href: "/creator/tests", iconName: "LayoutDashboard", roles: ["creator"] },
    { id: "creator-questions", label: "Questions", href: "/creator/questions", iconName: "LayoutDashboard", roles: ["creator"] },
  ],
};
