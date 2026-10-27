import { MODULE_MANIFESTS } from "./manifests";
import type { AllModulesState, ModuleExportPayload, ModuleId, ModuleManifest, ModuleState } from "./types";

const STORAGE_KEY = "questlab-modules-registry-v1";
const EVENT_NAME = "questlab-module-registry-change";

function getDefaultState(): AllModulesState {
  const result: AllModulesState = {};
  for (const [key, manifest] of Object.entries(MODULE_MANIFESTS)) {
    result[key as ModuleId] = {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
  }
  return result;
}

let memoryState: AllModulesState = getDefaultState();

function loadFromStorage(): AllModulesState {
  if (typeof window === "undefined") {
    return memoryState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultState();
      saveToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AllModulesState;
    // Manifestdagi yangi modullar yoki sozlamalarni merge qilish
    const merged: AllModulesState = getDefaultState();
    for (const [key, manifest] of Object.entries(MODULE_MANIFESTS)) {
      const id = key as ModuleId;
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
    return getDefaultState();
  }
}

function saveToStorage(state: AllModulesState) {
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

export const ModuleRegistry = {
  getAllManifests(): ModuleManifest[] {
    return Object.values(MODULE_MANIFESTS);
  },

  getManifest(id: ModuleId): ModuleManifest | undefined {
    return MODULE_MANIFESTS[id];
  },

  getAllState(): AllModulesState {
    return loadFromStorage();
  },

  getModuleState<T extends Record<string, unknown> = Record<string, unknown>>(id: ModuleId): ModuleState<T> {
    const all = loadFromStorage();
    const manifest = MODULE_MANIFESTS[id];
    if (!manifest) {
      throw new Error(`Module ${id} is not registered.`);
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

  isEnabled(id: ModuleId): boolean {
    return this.getModuleState(id).enabled;
  },

  setEnabled(id: ModuleId, enabled: boolean): void {
    const all = loadFromStorage();
    const manifest = MODULE_MANIFESTS[id];
    if (!manifest) return;

    all[id] = {
      enabled,
      settings: all[id]?.settings ? { ...all[id]?.settings } : { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(all);
  },

  updateSettings<T extends Record<string, unknown>>(id: ModuleId, partialSettings: Partial<T>): void {
    const all = loadFromStorage();
    const manifest = MODULE_MANIFESTS[id];
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
    saveToStorage(all);
  },

  resetModule(id: ModuleId): void {
    const all = loadFromStorage();
    const manifest = MODULE_MANIFESTS[id];
    if (!manifest) return;

    all[id] = {
      enabled: manifest.defaultEnabled,
      settings: { ...manifest.defaultSettings },
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(all);
  },

  resetAll(): void {
    const defaultState = getDefaultState();
    saveToStorage(defaultState);
  },

  exportConfig(): string {
    const all = loadFromStorage();
    const payload: ModuleExportPayload = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      modules: all,
    };
    return JSON.stringify(payload, null, 2);
  },

  importConfig(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as Partial<ModuleExportPayload>;
      if (!parsed.modules || typeof parsed.modules !== "object") {
        return { success: false, message: "Noto'g'ri konfiguratsiya formati: 'modules' maydoni topilmadi." };
      }

      const merged = getDefaultState();
      for (const [key, manifest] of Object.entries(MODULE_MANIFESTS)) {
        const id = key as ModuleId;
        const incoming = parsed.modules[id];
        if (incoming) {
          merged[id] = {
            enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : manifest.defaultEnabled,
            settings: { ...manifest.defaultSettings, ...(incoming.settings || {}) },
            updatedAt: new Date().toISOString(),
          };
        }
      }

      saveToStorage(merged);
      return { success: true, message: "Modullar konfiguratsiyasi muvaffaqiyatli import qilindi." };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "JSON faylni tahlil qilishda xatolik yuz berdi.",
      };
    }
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
