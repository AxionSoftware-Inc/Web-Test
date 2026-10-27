import type { ModuleManifest } from "../kernel/types";

export const assessmentManifest: ModuleManifest = {
  id: "assessment",
  name: "Assessment & Test Topshirish Yadrosi",
  tagline: "Test sessiyasi, real vaqt hisobi va javoblar tekshiruvi",
  description: "Test yechish, har bir savolga sarflangan vaqt, topshirishdan oldin ko'rib chiqish va natijalarni hisoblash.",
  version: "2.0.0",
  category: "core",
  iconName: "CheckCircle2",
  defaultEnabled: true,
  routePrefixes: ["/test-session", "/tests"],
  defaultSettings: {
    timeTrackingEnabled: true,
    allowReviewBeforeSubmit: true,
    instantFeedback: false,
    autoSubmitOnTimeUp: true,
    passingScorePercentage: 60,
  },
  settingsSchema: [
    {
      key: "timeTrackingEnabled",
      label: "Vaqt nazorati",
      description: "Test davomida har bir savolga sarflangan vaqtni hisoblash",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "allowReviewBeforeSubmit",
      label: "Topshirishdan oldin qayta ko'rish",
      description: "Barcha javoblarni tekshirib chiqish ruxsati",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "passingScorePercentage",
      label: "O'tish balli (%)",
      description: "Minimal foiz ko'rsatkichi",
      type: "number",
      defaultValue: 60,
      min: 10,
      max: 100,
    },
  ],
  navItems: [
    { id: "public-tests", label: "Tests", href: "/tests", iconName: "LayoutDashboard", roles: ["public"] },
  ],
};

export const masteryManifest: ModuleManifest = {
  id: "mastery",
  name: "Mastery Engine (Bilim Darajasi Tahlili)",
  tagline: "Moslashuvchan bilim baholash va zaif mavzular tahlili",
  description: "Mavzular grafigi, talabaning kuchli va zaif tomonlarini aniqlash hamda ta'lim traektoriyasini shakllantirish.",
  version: "2.0.0",
  category: "academic",
  iconName: "BrainCircuit",
  defaultEnabled: true,
  routePrefixes: ["/diagnosis", "/mistakes"],
  defaultSettings: {
    passingThreshold: 0.8,
    decayRate: 0.05,
    prerequisiteEnforcement: true,
    recommendationsLimit: 5,
  },
  settingsSchema: [
    {
      key: "passingThreshold",
      label: "Mastery chegarasi (0.5 - 1.0)",
      description: "Mavzuni to'liq o'zlashtirgan deb hisoblash koeffitsiyenti",
      type: "number",
      defaultValue: 0.8,
      min: 0.5,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "prerequisiteEnforcement",
      label: "Pre-requisite (Boshlang'ich talab) qat'iyligi",
      description: "Oldingi mavzuni bilmasa keyingi mavzuga o'tkazmaslik",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [],
};

export const examPacksManifest: ModuleManifest = {
  id: "exam-packs",
  name: "Exam Packs & Test Bazalari",
  tagline: "Test to'plamlari, to'liq paketlar va ko'p bosqichli imtihonlar",
  description: "Katta hajmli test to'plamlarini boshqarish, fayllardan import qilish va maxsus kodlar bilan himoyalash.",
  version: "2.0.0",
  category: "content",
  iconName: "Package",
  defaultEnabled: true,
  routePrefixes: ["/exam-packs"],
  defaultSettings: {
    allowPublicImports: true,
    maxPackQuestions: 200,
    requireVerification: false,
    defaultTimeLimitMinutes: 45,
  },
  settingsSchema: [
    {
      key: "allowPublicImports",
      label: "Fayldan import qilishga ruxsat",
      description: "Fayl orqali test paketlarini yuklash",
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "defaultTimeLimitMinutes",
      label: "Standart vaqt (daqiqa)",
      description: "Yangi yaratiladigan testlar uchun vaqt",
      type: "number",
      defaultValue: 45,
      min: 5,
      max: 180,
    },
  ],
  navItems: [],
};

export const testGeneratorManifest: ModuleManifest = {
  id: "test-generator",
  name: "Test Generator & Ochiq Studiya",
  tagline: "Formula, matn yoki fayllardan tezkor test yaratish",
  description: "Matnni nusxalash (Smart Paste), Word/Excel fayllar yuklash va LaTeX formulalar bilan bir necha soniyada test yaratish.",
  version: "2.0.0",
  category: "tools",
  iconName: "Sparkles",
  defaultEnabled: true,
  routePrefixes: ["/create-test", "/crud"],
  defaultSettings: {
    enableLatexRendering: true,
    defaultDifficulty: "intermediate",
    autoGenerateExplanations: true,
  },
  settingsSchema: [
    {
      key: "enableLatexRendering",
      label: "LaTeX formulalarini ko'rsatish",
      description: "Matematik ifodalarni chiroyli render qilish",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [
    {
      id: "public-create-test",
      label: "Test qo'shish",
      href: "/create-test",
      iconName: "Plus",
      isAction: true,
      roles: ["public", "student", "teacher", "creator", "school", "admin"],
      order: 100,
    },
  ],
};

export const learningManifest: ModuleManifest = {
  id: "learning",
  name: "Interactive Learning & Darslar",
  tagline: "Mavzular, interaktiv nazariya va ko'nikmalar",
  description: "Aniq fanlar bo'yicha interaktiv darslar va bosqichma-bosqich maslahatlar.",
  version: "2.0.0",
  category: "academic",
  iconName: "BookOpen",
  defaultEnabled: true,
  routePrefixes: ["/learn", "/subjects", "/practice", "/questions"],
  defaultSettings: {
    interactiveLessonsEnabled: true,
    stepByStepHints: true,
  },
  settingsSchema: [
    {
      key: "interactiveLessonsEnabled",
      label: "Interaktiv darslar",
      description: "Nazariy ma'lumotlarni interaktiv mashqlar bilan birga taqdim etish",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [
    { id: "public-subjects", label: "Subjects", href: "/subjects", iconName: "BookOpen", roles: ["public"] },
    { id: "public-practice", label: "Practice", href: "/practice", iconName: "Target", roles: ["public"] },
    { id: "public-questions", label: "Questions", href: "/questions", iconName: "BookOpen", roles: ["public"] },
  ],
};

export const localizationManifest: ModuleManifest = {
  id: "localization",
  name: "Localization & Ko'p Tillilik",
  tagline: "Tizim tili va hududiy moslashuv",
  description: "O'zbekcha, Ruscha va Inglizcha interfeys boshqaruvi.",
  version: "2.0.0",
  category: "core",
  iconName: "Languages",
  defaultEnabled: true,
  routePrefixes: ["/languages"],
  defaultSettings: {
    defaultLocale: "uz",
    allowLocaleSwitch: true,
  },
  settingsSchema: [
    {
      key: "defaultLocale",
      label: "Asosiy til",
      description: "Sukut bo'yicha tizim tili",
      type: "select",
      defaultValue: "uz",
      options: [
        { label: "O'zbekcha (UZ)", value: "uz" },
        { label: "Русский (RU)", value: "ru" },
        { label: "English (EN)", value: "en" },
      ],
    },
  ],
  navItems: [],
};

export const authManifest: ModuleManifest = {
  id: "auth",
  name: "Auth & Xavfsizlik Yadrosi",
  tagline: "Foydalanuvchilar, rollar va kirish huquqlari",
  description: "Rollar profili, sessiya xavfsizligi va identifikatsiya.",
  version: "2.0.0",
  category: "core",
  iconName: "ShieldCheck",
  defaultEnabled: true,
  routePrefixes: ["/auth"],
  defaultSettings: {
    mockIdentityFallback: true,
    sessionTimeoutMinutes: 120,
  },
  settingsSchema: [
    {
      key: "mockIdentityFallback",
      label: "Offline Identity rejimi",
      description: "Backend bo'lmaganda mahalliy profil bilan ishlash",
      type: "boolean",
      defaultValue: true,
    },
  ],
  navItems: [],
};
