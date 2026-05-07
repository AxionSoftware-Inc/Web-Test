export const supportedLocales = [
  {
    code: "uz",
    name: "O'zbekcha",
    status: "Primary",
    scope: "Landing, Algebra MVP, test flow, diagnosis.",
  },
  {
    code: "en",
    name: "English",
    status: "Ready for content",
    scope: "UI dictionary and lessons can be translated next.",
  },
  {
    code: "ru",
    name: "Русский",
    status: "Planned",
    scope: "School and teacher sales pages can be localized.",
  },
];

export const localizationPlan = [
  "Keep route structure stable and translate content through dictionaries.",
  "Start with UI labels, then test explanations, then lesson content.",
  "Store question prompt, options, answer explanation and skill names per locale.",
  "Backend later adds locale-aware content tables or JSON columns.",
];
