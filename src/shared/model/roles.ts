import { BookOpenCheck, Building2, GraduationCap, ShieldCheck, UserRound } from "lucide-react";

export const roles = [
  {
    id: "student",
    label: "Student",
    home: "/dashboard",
    description: "Test ishlash, mistake bank va profile progress.",
    icon: UserRound,
  },
  {
    id: "teacher",
    label: "Teacher",
    home: "/teacher/dashboard",
    description: "Class ochish, test biriktirish, natijalarni ko‘rish.",
    icon: GraduationCap,
  },
  {
    id: "school",
    label: "School",
    home: "/schools/dashboard",
    description: "Learning center analytics va school flow.",
    icon: Building2,
  },
  {
    id: "creator",
    label: "Creator",
    home: "/crud",
    description: "Test, savol va exam pack yaratish.",
    icon: BookOpenCheck,
  },
  {
    id: "admin",
    label: "Admin",
    home: "/admin",
    description: "MVP monitoring va content overview.",
    icon: ShieldCheck,
  },
] as const;

export type UserRole = (typeof roles)[number]["id"];

export function getRole(roleId: string | null | undefined) {
  return roles.find((role) => role.id === roleId) ?? roles[0];
}
