import type { ModuleManifest } from "../kernel/types";

export interface StudentModuleConfig extends Record<string, unknown> {
  showDetailedDiagnostics: boolean;
  enableMistakeBank: boolean;
  gamificationEnabled: boolean;
  allowRetakes: boolean;
}

export const studentManifest: ModuleManifest<StudentModuleConfig> = {
  id: "student",
  name: "Student & O'quvchi Portali Moduli",
  tagline: "Shaxsiy kabinet, natijalar arxivi va xatolar banki",
  description: "O'quvchining shaxsiy o'sish traektoriyasi, test natijalari, xatolar ustida ishlash bo'limi va ko'nikmalar rivoji.",
  version: "2.0.0",
  category: "academic",
  iconName: "UserRound",
  defaultEnabled: true,
  routePrefixes: ["/student"],
  defaultSettings: {
    showDetailedDiagnostics: true,
    enableMistakeBank: true,
    gamificationEnabled: true,
    allowRetakes: true,
  },
  settingsSchema: [
    {
      key: "showDetailedDiagnostics",
      label: "Batafsil diagnostika",
      description: "O'quvchiga uning zaif mavzulari tahlilini ko'rsatish",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "enableMistakeBank",
      label: "Xatolar banki (Mistake Bank)",
      description: "Xato qilingan savollarni yig'ib borish va qayta mashq qilish",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "gamificationEnabled",
      label: "Rag'batlantiruvchi ballar",
      description: "Tajriba ochkolari va faollik darajalari",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [
    { id: "student-home", label: "Home", href: "/student/home", iconName: "Home", roles: ["student"] },
    { id: "student-tests", label: "Tests", href: "/student/tests", iconName: "LayoutDashboard", roles: ["student"] },
    { id: "student-mistakes", label: "Mistakes", href: "/student/mistakes", iconName: "TriangleAlert", roles: ["student"] },
    { id: "student-progress", label: "Progress", href: "/student/progress", iconName: "BarChart3", roles: ["student"] },
  ],
};
