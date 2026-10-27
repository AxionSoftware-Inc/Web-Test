import type { ModuleManifest } from "../kernel/types";

export interface TeacherModuleConfig extends Record<string, unknown> {
  allowCustomAssignments: boolean;
  showStudentRankings: boolean;
  autoGradingEnabled: boolean;
  maxActiveClasses: number;
}

export const teacherManifest: ModuleManifest<TeacherModuleConfig> = {
  id: "teacher",
  name: "Teacher & Sinf Monitoringi Moduli",
  tagline: "O'qituvchining dars va vazifalar boshqaruv xonasi",
  description: "Sinflar ochish, uyga vazifa yoki nazorat testlarini biriktirish va o'quvchilar natijalarini kuzatish.",
  version: "2.0.0",
  category: "management",
  iconName: "GraduationCap",
  defaultEnabled: true,
  routePrefixes: ["/teacher"],
  defaultSettings: {
    allowCustomAssignments: true,
    showStudentRankings: true,
    autoGradingEnabled: true,
    maxActiveClasses: 25,
  },
  settingsSchema: [
    {
      key: "allowCustomAssignments",
      label: "Maxsus vazifalar berish",
      description: "O'qituvchi o'zining shaxsiy savollaridan iborat topshiriq bera olishi",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "showStudentRankings",
      label: "O'quvchilar reytingini ko'rsatish",
      description: "Sinfdagi umumiy peshqadamlik jadvalini o'quvchilarga ko'rsatish",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "autoGradingEnabled",
      label: "Avtomatik baholash",
      description: "Test yakunlanganda tizim avtomatik ball qo'yishi",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [
    { id: "teacher-home", label: "Bosh sahifa", href: "/teacher/home", iconName: "Home", roles: ["teacher"] },
    { id: "teacher-classes", label: "Sinflar", href: "/teacher/classes", iconName: "GraduationCap", roles: ["teacher"] },
    { id: "teacher-students", label: "O'quvchilar", href: "/teacher/students", iconName: "UsersRound", roles: ["teacher"] },
    { id: "teacher-add-test", label: "Test qo'shish", href: "/teacher/add-test", iconName: "Plus", roles: ["teacher"] },
    { id: "teacher-packs", label: "Bazalar", href: "/teacher/packs", iconName: "PackageCheck", roles: ["teacher"] },
    { id: "teacher-results", label: "Natijalar", href: "/teacher/results", iconName: "BarChart3", roles: ["teacher"] },
  ],
};
