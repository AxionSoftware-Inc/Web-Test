import type { ModuleId, ModuleManifest } from "./types";

export interface AssessmentConfig extends Record<string, unknown> {
  timeTrackingEnabled: boolean;
  allowReviewBeforeSubmit: boolean;
  instantFeedback: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  autoSubmitOnTimeUp: boolean;
  passingScorePercentage: number;
}

export interface MasteryConfig extends Record<string, unknown> {
  passingThreshold: number;
  decayRate: number;
  prerequisiteEnforcement: boolean;
  confidenceWeighting: boolean;
  recommendationsLimit: number;
}

export interface ExamPacksConfig extends Record<string, unknown> {
  allowPublicImports: boolean;
  maxPackQuestions: number;
  requireVerification: boolean;
  defaultTimeLimitMinutes: number;
}

export interface TestGeneratorConfig extends Record<string, unknown> {
  enableLatexRendering: boolean;
  defaultDifficulty: "beginner" | "intermediate" | "advanced";
  autoGenerateExplanations: boolean;
  maxOptionsPerQuestion: number;
}

export interface SchoolsConfig extends Record<string, unknown> {
  enableSchoolAnalytics: boolean;
  allowStudentSelfRegistration: boolean;
  classCodeExpiryDays: number;
  showTeacherPerformance: boolean;
}

export interface TeacherConfig extends Record<string, unknown> {
  allowCustomAssignments: boolean;
  showStudentRankings: boolean;
  autoGradingEnabled: boolean;
  maxActiveClasses: number;
}

export interface StudentConfig extends Record<string, unknown> {
  showDetailedDiagnostics: boolean;
  enableMistakeBank: boolean;
  gamificationEnabled: boolean;
  allowRetakes: boolean;
}

export interface LearningConfig extends Record<string, unknown> {
  interactiveLessonsEnabled: boolean;
  stepByStepHints: boolean;
  autoBookmarkProgress: boolean;
}

export interface LocalizationConfig extends Record<string, unknown> {
  defaultLocale: "uz" | "ru" | "en";
  allowLocaleSwitch: boolean;
  persistPreference: boolean;
}

export interface AuthConfig extends Record<string, unknown> {
  mockIdentityFallback: boolean;
  sessionTimeoutMinutes: number;
  enforceRoleGuards: boolean;
}

export const MODULE_MANIFESTS: Record<ModuleId, ModuleManifest> = {
  assessment: {
    id: "assessment",
    name: "Baholash & Test topshirish",
    tagline: "Test sessiyasi, vaqt nazorati va javoblarni tekshirish",
    description: "Talaba test topshirishi, real vaqtda sarflangan vaqtni hisoblash, qayta ko'rib chiqish va natijalarni hisoblash mexanizmi.",
    category: "core",
    version: "1.2.0",
    iconName: "CheckCircle2",
    defaultEnabled: true,
    defaultSettings: {
      timeTrackingEnabled: true,
      allowReviewBeforeSubmit: true,
      instantFeedback: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      autoSubmitOnTimeUp: true,
      passingScorePercentage: 60,
    } satisfies AssessmentConfig,
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
        description: "Talaba testni yakunlashdan avval barcha javoblarini ko'rib chiqa olishi",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "instantFeedback",
        label: "Darhol natija ko'rsatish",
        description: "Har bir savol tanlanganda to'g'ri/noto'g'riligini darhol bildirish",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "shuffleQuestions",
        label: "Savollarni aralashtirish",
        description: "Testdagi savollar tartibini tasodifiy almashtirish",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "autoSubmitOnTimeUp",
        label: "Vaqt tugaganda avto-topshirish",
        description: "Belgilangan vaqt bitganda testni avtomatik serverga jo'natish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "passingScorePercentage",
        label: "O'tish balli (%)",
        description: "Muvaffaqiyatli topshirish uchun minimal foiz ko'rsatkichi",
        type: "number",
        defaultValue: 60,
        min: 10,
        max: 100,
        step: 5,
      },
    ],
  },

  mastery: {
    id: "mastery",
    name: "Mastery Engine (Bilim darajasi)",
    tagline: "Moslashuvchan bilim baholash va zaif mavzular tahlili",
    description: "Mavzular grafigi, talabaning kuchli va zaif tomonlarini aniqlash hamda shaxsiy ta'lim traektoriyasini tuzish.",
    category: "academic",
    version: "2.1.0",
    iconName: "BrainCircuit",
    defaultEnabled: true,
    defaultSettings: {
      passingThreshold: 0.8,
      decayRate: 0.05,
      prerequisiteEnforcement: true,
      confidenceWeighting: true,
      recommendationsLimit: 5,
    } satisfies MasteryConfig,
    settingsSchema: [
      {
        key: "passingThreshold",
        label: "Mastery chegarasi (0.0 - 1.0)",
        description: "Mavzuni to'liq o'zlashtirgan deb hisoblash koeffitsiyenti",
        type: "number",
        defaultValue: 0.8,
        min: 0.5,
        max: 1.0,
        step: 0.05,
      },
      {
        key: "decayRate",
        label: "Bilim pasayish koeffitsiyenti",
        description: "Uzoq vaqt mashq qilinmagan mavzularning o'zlashtirish darajasi sekin pasayishi",
        type: "number",
        defaultValue: 0.05,
        min: 0.0,
        max: 0.2,
        step: 0.01,
      },
      {
        key: "prerequisiteEnforcement",
        label: "Pre-requisite (Boshlang'ich talab) qat'iyligi",
        description: "Oldingi fundamental mavzu o'zlashtirilmaguncha keyingi mavzuni tavsiya qilmaslik",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "confidenceWeighting",
        label: "Ishonch koeffitsiyenti",
        description: "Talabaning javob berish tezligi va barqarorligini hisobga olish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "recommendationsLimit",
        label: "Maksimal tavsiyalar soni",
        description: "Dashboardda ko'rsatiladigan zaif mavzular bo'yicha tavsiyalar chegarasi",
        type: "number",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 1,
      },
    ],
  },

  "exam-packs": {
    id: "exam-packs",
    name: "Exam Packs (Imtihon bazalari)",
    tagline: "Test to'plamlari, import/eksport va paketlar",
    description: "Katta hajmli test to'plamlarini boshqarish, JSON/Word/Excel fayllardan import qilish va maxsus kodlar bilan himoyalash.",
    category: "content",
    version: "1.1.0",
    iconName: "Package",
    defaultEnabled: true,
    defaultSettings: {
      allowPublicImports: true,
      maxPackQuestions: 200,
      requireVerification: false,
      defaultTimeLimitMinutes: 45,
    } satisfies ExamPacksConfig,
    settingsSchema: [
      {
        key: "allowPublicImports",
        label: "Fayldan import qilishga ruxsat",
        description: "O'qituvchi va kontent yaratuvchilarga fayl orqali test yuklash imkoniyati",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "maxPackQuestions",
        label: "Bitta paketdagi maksimal savollar",
        description: "Bitta imtihon paketiga qo'shish mumkin bo'lgan savollar soni",
        type: "number",
        defaultValue: 200,
        min: 10,
        max: 1000,
        step: 10,
      },
      {
        key: "requireVerification",
        label: "Nashr qilishdan oldin moderatsiya",
        description: "Paket umumiy ro'yxatga chiqishidan oldin administrator tekshiruvidan o'tishi shart",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "defaultTimeLimitMinutes",
        label: "Standart vaqt (daqiqa)",
        description: "Yangi yaratiladigan testlar uchun sukut bo'yicha vaqt",
        type: "number",
        defaultValue: 45,
        min: 5,
        max: 180,
        step: 5,
      },
    ],
  },

  "test-generator": {
    id: "test-generator",
    name: "Test Generator & LaTeX Studio",
    tagline: "Murakkab formulali savollar va shablonlar studiyasi",
    description: "Matematik formulalar (KaTeX), tushuntirishlar va turli qiyinlikdagi savollarni qulay generator orqali shakllantirish.",
    category: "tools",
    version: "1.0.5",
    iconName: "Sparkles",
    defaultEnabled: true,
    defaultSettings: {
      enableLatexRendering: true,
      defaultDifficulty: "intermediate",
      autoGenerateExplanations: true,
      maxOptionsPerQuestion: 5,
    } satisfies TestGeneratorConfig,
    settingsSchema: [
      {
        key: "enableLatexRendering",
        label: "LaTeX formulalarini ko'rsatish",
        description: "$...$ va $$...$$ ko'rinishidagi matematik ifodalarni chiroyli render qilish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "defaultDifficulty",
        label: "Standart qiyinlik darajasi",
        description: "Yangi generatsiya qilinadigan savollarning sukut darajasi",
        type: "select",
        defaultValue: "intermediate",
        options: [
          { label: "Boshlang'ich (Beginner)", value: "beginner" },
          { label: "O'rta (Intermediate)", value: "intermediate" },
          { label: "Murakkab (Advanced)", value: "advanced" },
        ],
      },
      {
        key: "autoGenerateExplanations",
        label: "Avtomatik izoh va yechim qo'shish",
        description: "Savol kiritilganda uning to'liq yechim bosqichlarini ham saqlash",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "maxOptionsPerQuestion",
        label: "Maksimal javob variantlari soni",
        description: "Multiple-choice savollardagi maksimal variantlar",
        type: "number",
        defaultValue: 5,
        min: 2,
        max: 8,
        step: 1,
      },
    ],
  },

  schools: {
    id: "schools",
    name: "Schools & O'quv Markazlari",
    tagline: "Tashkilotlar, sinflar va pedagogik monitoring",
    description: "O'quv markazlari va maktablar uchun sinflar yaratish, o'quvchilarni guruhlash va keng ko'lamli hisobotlar.",
    category: "management",
    version: "1.3.0",
    iconName: "Building2",
    defaultEnabled: true,
    defaultSettings: {
      enableSchoolAnalytics: true,
      allowStudentSelfRegistration: true,
      classCodeExpiryDays: 30,
      showTeacherPerformance: true,
    } satisfies SchoolsConfig,
    settingsSchema: [
      {
        key: "enableSchoolAnalytics",
        label: "Maktab tahliliy hisobotlari",
        description: "Direktor va boshqaruvchilar uchun umumiy reyting va dinamikani ko'rsatish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "allowStudentSelfRegistration",
        label: "O'quvchilar o'zi qo'shilishi",
        description: "O'quvchilar maxsus sinf kodi orqali mustaqil sinfga a'zo bo'la olishi",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "classCodeExpiryDays",
        label: "Sinf kodi muddati (kun)",
        description: "Taklif havolasi yoki kodi necha kun amal qilishi",
        type: "number",
        defaultValue: 30,
        min: 1,
        max: 180,
        step: 1,
      },
      {
        key: "showTeacherPerformance",
        label: "O'qituvchilar ko'rsatkichini tahlil qilish",
        description: "O'qituvchilar dars berayotgan sinflar o'rtasidagi taqqoslama hisobot",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  teacher: {
    id: "teacher",
    name: "Teacher Studio (O'qituvchi xonasi)",
    tagline: "Topshiriqlar berish, monitoring va baholash",
    description: "O'qituvchining dars boshqaruvi, uyga vazifa yoki nazorat testlarini biriktirish va o'quvchilar javoblarini tahlil qilish.",
    category: "management",
    version: "1.2.0",
    iconName: "GraduationCap",
    defaultEnabled: true,
    defaultSettings: {
      allowCustomAssignments: true,
      showStudentRankings: true,
      autoGradingEnabled: true,
      maxActiveClasses: 20,
    } satisfies TeacherConfig,
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
      {
        key: "maxActiveClasses",
        label: "Maksimal faol sinflar soni",
        description: "Bitta o'qituvchi boshqara oladigan faol guruhlar soni",
        type: "number",
        defaultValue: 20,
        min: 1,
        max: 50,
        step: 1,
      },
    ],
  },

  student: {
    id: "student",
    name: "Student Hub (O'quvchi portali)",
    tagline: "Shaxsiy kabinet, natijalar va xatolar banki",
    description: "O'quvchining o'z rivojlanish grafigi, xatolar ustida ishlash bo'limi va shaxsiy test natijalari arxivi.",
    category: "academic",
    version: "1.1.0",
    iconName: "UserRound",
    defaultEnabled: true,
    defaultSettings: {
      showDetailedDiagnostics: true,
      enableMistakeBank: true,
      gamificationEnabled: true,
      allowRetakes: true,
    } satisfies StudentConfig,
    settingsSchema: [
      {
        key: "showDetailedDiagnostics",
        label: "Batafsil diagnostika",
        description: "O'quvchiga uning qaysi formulalarda ko'p xato qilayotganini tahlil qilib berish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "enableMistakeBank",
        label: "Xatolar banki (Mistake Bank)",
        description: "Noto'g'ri javob berilgan savollarni alohida to'plab borish va qayta ishlash",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "gamificationEnabled",
        label: "Gamifikatsiya (Yutuqlar va tajriba)",
        description: "Muntazam shug'ullanish uchun rag'batlantiruvchi ballar va darajalar",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "allowRetakes",
        label: "Testni qayta topshirish ruxsati",
        description: "O'quvchiga o'z natijasini yaxshilash uchun qayta urinish imkonini berish",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  learning: {
    id: "learning",
    name: "Interactive Learning (Interaktiv ta'lim)",
    tagline: "Bosqichma-bosqich darslar va nazariy asoslar",
    description: "Algebra va aniq fanlar bo'yicha tushuntirishlar, interaktiv misollar va bosqichli maslahatlar.",
    category: "academic",
    version: "1.0.0",
    iconName: "BookOpen",
    defaultEnabled: true,
    defaultSettings: {
      interactiveLessonsEnabled: true,
      stepByStepHints: true,
      autoBookmarkProgress: true,
    } satisfies LearningConfig,
    settingsSchema: [
      {
        key: "interactiveLessonsEnabled",
        label: "Interaktiv darslar",
        description: "Nazariy ma'lumotlarni interaktiv mashqlar bilan birga taqdim etish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "stepByStepHints",
        label: "Bosqichma-bosqich yordam",
        description: "Misol yechish paytida bosqichma-bosqich yo'naltiruvchi maslahatlar berish",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "autoBookmarkProgress",
        label: "O'qish joyini eslab qolish",
        description: "Dars qaysi joyida to'xtatilgan bo'lsa, o'sha yerdan davom ettirish",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  localization: {
    id: "localization",
    name: "Localization & Tillar",
    tagline: "Ko'p tillilik va hududiy moslashuv",
    description: "Tizim interfeysi va test kontentini o'zbek, rus va ingliz tillarida qulay boshqarish.",
    category: "core",
    version: "1.0.0",
    iconName: "Languages",
    defaultEnabled: true,
    defaultSettings: {
      defaultLocale: "uz",
      allowLocaleSwitch: true,
      persistPreference: true,
    } satisfies LocalizationConfig,
    settingsSchema: [
      {
        key: "defaultLocale",
        label: "Standart tizim tili",
        description: "Foydalanuvchi birinchi marta kirganda ko'rsatiladigan asosiy til",
        type: "select",
        defaultValue: "uz",
        options: [
          { label: "O'zbekcha (UZ)", value: "uz" },
          { label: "Русский (RU)", value: "ru" },
          { label: "English (EN)", value: "en" },
        ],
      },
      {
        key: "allowLocaleSwitch",
        label: "Tilni o'zgartirish ruxsati",
        description: "Foydalanuvchilarga menyudan o'z xohishiga ko'ra tilni o'zgartirishga ruxsat",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "persistPreference",
        label: "Tanlangan tilni xotirada saqlash",
        description: "Brauzer qayta ochilganda ham tanlangan tilni eslab qolish",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },

  auth: {
    id: "auth",
    name: "Authentication & Rollar",
    tagline: "Foydalanuvchi identifikatsiyasi va huquqlari",
    description: "Lokal/server profillar, o'qituvchi, o'quvchi, ma'mur rollari va xavfsiz boshqaruv.",
    category: "core",
    version: "1.1.0",
    iconName: "ShieldCheck",
    defaultEnabled: true,
    defaultSettings: {
      mockIdentityFallback: true,
      sessionTimeoutMinutes: 120,
      enforceRoleGuards: true,
    } satisfies AuthConfig,
    settingsSchema: [
      {
        key: "mockIdentityFallback",
        label: "Offline / Local Identity rejimi",
        description: "Backend server bo'lmaganda brauzer xotirasidagi profil bilan ishlash",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "sessionTimeoutMinutes",
        label: "Sessiya vaqti (daqiqa)",
        description: "Foydalanuvchi tizimda harakatsiz tura oladigan maksimal daqiqa",
        type: "number",
        defaultValue: 120,
        min: 15,
        max: 720,
        step: 15,
      },
      {
        key: "enforceRoleGuards",
        label: "Rollar xavfsizligi tekshiruvi",
        description: "Tegishli rolga ega bo'lmagan foydalanuvchini boshqa sahifalardan cheklash",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
};
