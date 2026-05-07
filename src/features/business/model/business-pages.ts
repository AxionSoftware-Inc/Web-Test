import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpenCheck, Download, FileText, GraduationCap, Landmark, ShieldCheck, UsersRound } from "lucide-react";

type BusinessPage = {
  eyebrow: string;
  title: string;
  copy: string;
  price: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  stats: string[][];
  workflow: string[][];
  features: Array<[string, string, LucideIcon]>;
  pricing: string[][];
};

export const teacherPage: BusinessPage = {
  eyebrow: "Teacher plan",
  title: "Tutor va o'qituvchilar uchun skill-based test analytics",
  copy: "Class yarating, test bering, student natijalarini ko'ring va qaysi mavzu bo'yicha dars o'tish kerakligini aniq biling.",
  price: "99 000 - 299 000 so'm / oy",
  primaryHref: "/teacher#pricing",
  primaryLabel: "View teacher pricing",
  secondaryHref: "/teacher/dashboard",
  secondaryLabel: "Open demo dashboard",
  stats: [
    ["Classes", "Unlimited"],
    ["Reports", "PDF / CSV"],
    ["Best for", "Tutor"],
  ],
  workflow: [
    ["Class yaratish", "Studentlarni group bo'yicha ajrating."],
    ["Test berish", "Algebra, DTM yoki custom test assign qiling."],
    ["Weak topics report", "Qaysi skilllar tushmayotganini ko'ring."],
    ["Targeted homework", "Keyingi mashqni avtomatik tavsiya qiling."],
  ],
  features: [
    ["Class management", "Student ro'yxati, group, deadline va status.", UsersRound],
    ["Skill analytics", "Har student uchun kuchli/zaif skill breakdown.", BarChart3],
    ["Export", "PDF, CSV va parent report uchun tayyor format.", Download],
    ["Question review", "Xato savollar, explanation va recommended lesson.", FileText],
  ],
  pricing: [
    ["Starter", "99 000 so'm / oy", "1 teacher, 3 class, basic reports."],
    ["Pro Tutor", "199 000 so'm / oy", "Unlimited class, PDF export, weak topic analytics."],
    ["Team", "299 000 so'm / oy", "Multiple teachers, shared question bank, advanced reports."],
  ],
};

export const schoolsPage: BusinessPage = {
  eyebrow: "Schools",
  title: "O'quv markazlar uchun branded test portal",
  copy: "Markazingiz nomi bilan test portal, student dashboard, teacher analytics va monthly progress report.",
  price: "500 000 - 3 000 000 so'm / oy",
  primaryHref: "/schools#pricing",
  primaryLabel: "View school pricing",
  secondaryHref: "/schools/dashboard",
  secondaryLabel: "Open demo dashboard",
  stats: [
    ["Portal", "Branded"],
    ["Users", "Students + teachers"],
    ["Reports", "Monthly"],
  ],
  workflow: [
    ["Portal ochish", "academy.yoursite.uz yoki subdomain model."],
    ["Studentlarni qo'shish", "Group, level va exam target bo'yicha ajratish."],
    ["Exam preparation", "DTM/SAT/university packlarni assign qilish."],
    ["Monthly report", "Rahbariyat, teacher va parent uchun progress report."],
  ],
  features: [
    ["White-label", "Markaz nomi, logo va domain bilan portal.", Landmark],
    ["Teacher analytics", "Class, test, weak topic va student progress.", BarChart3],
    ["Student dashboard", "Har student uchun progress, retake, lesson path.", UsersRound],
    ["Access control", "Teacher, admin, student rollari.", ShieldCheck],
  ],
  pricing: [
    ["Small center", "500 000 so'm / oy", "Up to 100 students, branded portal, basic analytics."],
    ["Growth", "1 500 000 so'm / oy", "Up to 500 students, teacher analytics, monthly reports."],
    ["Enterprise", "3 000 000 so'm / oy", "Custom domain, advanced reports, priority setup."],
  ],
};

export const examPacksPage: BusinessPage = {
  eyebrow: "Exam packs",
  title: "Tayyor imtihon va mavzu paketlari",
  copy: "DTM Math, SAT Math, Linear Algebra University Pack va Python Interview Pack kabi tayyor sotiladigan paketlar.",
  price: "49 000 - 199 000 so'm",
  primaryHref: "/exam-packs#packs",
  primaryLabel: "View packs",
  secondaryHref: "/subjects/mathematics/topics/algebra",
  secondaryLabel: "Try Algebra MVP",
  stats: [
    ["Model", "One-time"],
    ["Includes", "Tests + review"],
    ["Retake", "Included"],
  ],
  workflow: [
    ["Pack tanlash", "Exam yoki mavzu bo'yicha paket tanlanadi."],
    ["Diagnostic test", "Boshlang'ich skill darajasi aniqlanadi."],
    ["Targeted practice", "Zaif skilllar bo'yicha mashq beriladi."],
    ["Final retake", "Progress qayta test bilan o'lchanadi."],
  ],
  features: [
    ["Skill-tagged tests", "Har savol topic va skillga bog'langan.", BookOpenCheck],
    ["Mistake analysis", "Xato sababi va keyingi lesson tavsiyasi.", BarChart3],
    ["Printable report", "PDF natija va weak topic summary.", Download],
    ["Exam roadmap", "Paket ichida tartibli preparation path.", GraduationCap],
  ],
  pricing: [
    ["DTM Math Pack", "49 000 so'm", "Algebra, geometry, arithmetic diagnostic tests."],
    ["SAT Math Pack", "99 000 so'm", "Timed sections, weak skill report, retake plan."],
    ["University Pack", "199 000 so'm", "Linear algebra/calculus packs with explanations."],
  ],
};
