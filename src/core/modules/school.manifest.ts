import type { ModuleManifest } from "../kernel/types";

export interface SchoolModuleConfig extends Record<string, unknown> {
  enableSchoolAnalytics: boolean;
  allowStudentSelfRegistration: boolean;
  classCodeExpiryDays: number;
  showTeacherPerformance: boolean;
}

export const schoolManifest: ModuleManifest<SchoolModuleConfig> = {
  id: "school",
  name: "School & Ta'lim Markazlari Moduli",
  tagline: "Maktablar, sinflar va pedagogik monitoring boshqaruvi",
  description: "Tashkilotlar uchun to'liq mustaqil maktab boshqaruvi, o'qituvchilar kabineti, sinflar va tahliliy hisobotlar.",
  version: "2.0.0",
  category: "management",
  iconName: "Building2",
  defaultEnabled: true,
  routePrefixes: ["/school", "/schools"],
  defaultSettings: {
    enableSchoolAnalytics: true,
    allowStudentSelfRegistration: true,
    classCodeExpiryDays: 30,
    showTeacherPerformance: true,
  },
  settingsSchema: [
    {
      key: "enableSchoolAnalytics",
      label: "Maktab tahliliy hisobotlari",
      description: "Direktor va rahbarlar uchun umumiy dinamikani ko'rsatish",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "allowStudentSelfRegistration",
      label: "O'quvchilar o'zi qo'shilishi",
      description: "O'quvchilar sinf kodi orqali mustaqil ro'yxatdan o'tishi",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "classCodeExpiryDays",
      label: "Sinf kodi muddati (kun)",
      description: "Taklif kodining amal qilish muddati",
      type: "number",
      defaultValue: 30,
      min: 1,
      max: 180,
    },
  ],
  navItems: [
    { id: "school-home", label: "Home", href: "/school/home", iconName: "Home", roles: ["school"] },
    { id: "school-classes", label: "Classes", href: "/school/classes", iconName: "GraduationCap", roles: ["school"] },
    { id: "school-teachers", label: "Teachers", href: "/school/teachers", iconName: "UsersRound", roles: ["school"] },
    { id: "school-students", label: "Students", href: "/school/students", iconName: "UserRound", roles: ["school"] },
    { id: "school-reports", label: "Reports", href: "/school/reports", iconName: "BarChart3", roles: ["school"] },
    { id: "school-settings", label: "Settings", href: "/school/settings", iconName: "Settings", roles: ["school"] },
  ],
};
