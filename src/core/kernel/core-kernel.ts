import { schoolManifest } from "../modules/school.manifest";
import { creatorManifest } from "../modules/creator.manifest";
import { teacherManifest } from "../modules/teacher.manifest";
import { studentManifest } from "../modules/student.manifest";
import {
  assessmentManifest,
  authManifest,
  examPacksManifest,
  learningManifest,
  localizationManifest,
  masteryManifest,
  testGeneratorManifest,
} from "../modules/core-modules.manifest";
import type {
  AllModulesRegistryState,
  CoreModuleId,
  ModuleExportPayload,
  ModuleManifest,
  ModuleNavItem,
  ModuleState,
} from "./types";
import { coreEventBus } from "./event-bus";

const STORAGE_KEY = "questlab-microkernel-registry-v2";
const EVENT_NAME = "questlab-kernel-state-change";

export const ALL_MANIFESTS: Record<CoreModuleId, ModuleManifest> = {
  school: schoolManifest,
  creator: creatorManifest,
  teacher: teacherManifest,
  student: studentManifest,
  assessment: assessmentManifest,
  mastery: masteryManifest,
  "exam-packs": examPacksManifest,
  "test-generator": testGeneratorManifest,
  learning: learningManifest,
  localization: localizationManifest,
  auth: authManifest,
};

function getInitialState(): AllModulesRegistryState {
  const result: AllModulesRegistryState = {};
  for (const [key, manifest] of Object.entries(ALL_MANIFESTS)) {
    const id = key as CoreModuleId;
    result[id] = {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
  }
  return result;
}

let memoryState: AllModulesRegistryState = getInitialState();

function loadKernelState(): AllModulesRegistryState {
  if (typeof window === "undefined") {
    return memoryState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveKernelState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AllModulesRegistryState;
    const merged: AllModulesRegistryState = getInitialState();

    for (const [key, manifest] of Object.entries(ALL_MANIFESTS)) {
      const id = key as CoreModuleId;
      const stored = parsed[id];
      if (stored) {
        merged[id] = {
          enabled: typeof stored.enabled === "boolean" ? stored.enabled : manifest.defaultEnabled,
          settings: { ...manifest.defaultSettings, ...(stored.settings || {}) },
          updatedAt: stored.updatedAt || new Date().toISOString(),
        };
      }
    }
    return merged;
  } catch {
    return getInitialState();
  }
}

function saveKernelState(state: AllModulesRegistryState) {
  memoryState = state;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
    } catch {
      // quota or private mode fallback
    }
  }
}

export const CoreKernel = {
  getManifests(): ModuleManifest[] {
    return Object.values(ALL_MANIFESTS);
  },

  getManifest(id: CoreModuleId): ModuleManifest | undefined {
    return ALL_MANIFESTS[id];
  },

  getState(): AllModulesRegistryState {
    return loadKernelState();
  },

  getModuleState<T extends Record<string, unknown> = Record<string, unknown>>(
    id: CoreModuleId,
  ): ModuleState<T> {
    const all = loadKernelState();
    const manifest = ALL_MANIFESTS[id];
    if (!manifest) {
      throw new Error(`[CoreKernel] Module "${id}" is not registered in Kernel.`);
    }

    const current = all[id];
    if (current) {
      return {
        enabled: current.enabled,
        settings: { ...manifest.defaultSettings, ...current.settings } as T,
        updatedAt: current.updatedAt,
      };
    }

    return {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings } as T,
      updatedAt: new Date().toISOString(),
    };
  },

  isModuleEnabled(id: CoreModuleId): boolean {
    return this.getModuleState(id).enabled;
  },

  setModuleEnabled(id: CoreModuleId, enabled: boolean): void {
    const all = loadKernelState();
    const manifest = ALL_MANIFESTS[id];
    if (!manifest) return;

    all[id] = {
      enabled,
      settings: all[id]?.settings ? { ...all[id]?.settings } : { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
    saveKernelState(all);

    coreEventBus.emit("module:status_changed", { moduleId: id, enabled }, id);
  },

  toggleModule(id: CoreModuleId): void {
    const current = this.isModuleEnabled(id);
    this.setModuleEnabled(id, !current);
  },

  updateModuleSettings<T extends Record<string, unknown>>(
    id: CoreModuleId,
    partialSettings: Partial<T>,
  ): void {
    const all = loadKernelState();
    const manifest = ALL_MANIFESTS[id];
    if (!manifest) return;

    const current = all[id] || {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };

    all[id] = {
      enabled: current.enabled,
      settings: { ...current.settings, ...partialSettings },
      updatedAt: new Date().toISOString(),
    };
    saveKernelState(all);

    coreEventBus.emit("module:settings_updated", { moduleId: id, settings: all[id].settings }, id);
  },

  resetModule(id: CoreModuleId): void {
    const all = loadKernelState();
    const manifest = ALL_MANIFESTS[id];
    if (!manifest) return;

    all[id] = {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
    saveKernelState(all);
    coreEventBus.emit("module:reset", { moduleId: id }, id);
  },

  resetAll(): void {
    const defaultState = getInitialState();
    saveKernelState(defaultState);
    coreEventBus.emit("kernel:reset_all", {}, "core");
  },

  exportConfig(): string {
    const all = loadKernelState();
    const payload: ModuleExportPayload = {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      modules: all,
    };
    return JSON.stringify(payload, null, 2);
  },

  importConfig(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as Partial<ModuleExportPayload>;
      if (!parsed.modules || typeof parsed.modules !== "object") {
        return { success: false, message: "Noto'g'ri konfiguratsiya: 'modules' maydoni topilmadi." };
      }

      const merged = getInitialState();
      for (const [key, manifest] of Object.entries(ALL_MANIFESTS)) {
        const id = key as CoreModuleId;
        const incoming = parsed.modules[id];
        if (incoming) {
          merged[id] = {
            enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : manifest.defaultEnabled,
            settings: { ...manifest.defaultSettings, ...(incoming.settings || {}) },
            updatedAt: new Date().toISOString(),
          };
        }
      }

      saveKernelState(merged);
      coreEventBus.emit("kernel:imported", { modules: merged }, "core");
      return { success: true, message: "Modullar konfiguratsiyasi muvaffaqiyatli import qilindi." };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "JSON faylni tahlil qilishda xatolik yuz berdi.",
      };
    }
  },

  /**
   * Dinamik Navigatsiya:
   * Faqat yoqilgan (enabled) modullarning belgilangan rolga mos navigatsiya elementlarini qaytaradi.
   * Agar modul o'chirilgan bo'lsa, uning birorta menyu elementi ko'rinmaydi!
   */
  getNavItemsFor(role: "student" | "teacher" | "school" | "creator" | "admin" | "public"): ModuleNavItem[] {
    const allManifests = this.getManifests();
    const items: ModuleNavItem[] = [];

    for (const manifest of allManifests) {
      if (!this.isModuleEnabled(manifest.id)) {
        continue; // Modul o'chirilgan bo'lsa, menyuga qo'shilmaydi!
      }

      for (const item of manifest.navItems) {
        if (!item.roles || item.roles.includes(role) || (role === "admin" && item.roles.includes("public"))) {
          items.push(item);
        }
      }
    }

    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * Marshrut tekshiruvi:
   * Agar berilgan URL biron modulga tegishli bo'lsa va o'sha modul o'chirilgan bo'lsa -> false qaytaradi.
   */
  isRouteActive(pathname: string): { allowed: boolean; moduleId?: CoreModuleId; moduleName?: string } {
    for (const manifest of this.getManifests()) {
      for (const prefix of manifest.routePrefixes) {
        if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
          const enabled = this.isModuleEnabled(manifest.id);
          return {
            allowed: enabled,
            moduleId: manifest.id,
            moduleName: manifest.name,
          };
        }
      }
    }
    return { allowed: true };
  },

  subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const listener = () => callback();
    window.addEventListener(EVENT_NAME, listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener(EVENT_NAME, listener);
      window.removeEventListener("storage", listener);
    };
  },
};
