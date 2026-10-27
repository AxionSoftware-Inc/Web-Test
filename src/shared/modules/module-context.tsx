"use client";

import { Cog, Power } from "lucide-react";
import Link from "next/link";
import React, { createContext, useContext, useSyncExternalStore } from "react";

import { MODULE_MANIFESTS } from "./manifests";
import { ModuleRegistry } from "./module-registry";
import type { AllModulesState, ModuleId, ModuleManifest } from "./types";

interface ModuleContextValue {
  modulesState: AllModulesState;
  manifests: ModuleManifest[];
  isLoaded: boolean;
  isEnabled: (id: ModuleId) => boolean;
  getSettings: <T extends Record<string, unknown>>(id: ModuleId) => T;
  toggleModule: (id: ModuleId) => void;
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void;
  updateSettings: <T extends Record<string, unknown>>(id: ModuleId, patch: Partial<T>) => void;
  resetModule: (id: ModuleId) => void;
  resetAll: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => { success: boolean; message: string };
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

function subscribe(callback: () => void) {
  return ModuleRegistry.subscribe(callback);
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "{}";
  return JSON.stringify(ModuleRegistry.getAllState());
}

function getServerSnapshot(): string {
  return "{}";
}

function emptySubscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getClientServerSnapshot() {
  return false;
}

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const rawState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getClientServerSnapshot);

  const modulesState: AllModulesState = React.useMemo(() => {
    try {
      return JSON.parse(rawState) as AllModulesState;
    } catch {
      return ModuleRegistry.getAllState();
    }
  }, [rawState]);

  const value: ModuleContextValue = React.useMemo(
    () => ({
      modulesState,
      manifests: Object.values(MODULE_MANIFESTS),
      isLoaded: isClient,
      isEnabled: (id: ModuleId) => {
        const item = modulesState[id];
        return item ? item.enabled : (MODULE_MANIFESTS[id]?.defaultEnabled ?? true);
      },
      getSettings: <T extends Record<string, unknown>>(id: ModuleId): T => {
        const manifest = MODULE_MANIFESTS[id];
        const item = modulesState[id];
        return { ...(manifest?.defaultSettings || {}), ...(item?.settings || {}) } as T;
      },
      toggleModule: (id: ModuleId) => {
        const current = modulesState[id]?.enabled ?? MODULE_MANIFESTS[id]?.defaultEnabled ?? true;
        ModuleRegistry.setEnabled(id, !current);
      },
      setModuleEnabled: (id: ModuleId, enabled: boolean) => {
        ModuleRegistry.setEnabled(id, enabled);
      },
      updateSettings: <T extends Record<string, unknown>>(id: ModuleId, patch: Partial<T>) => {
        ModuleRegistry.updateSettings(id, patch);
      },
      resetModule: (id: ModuleId) => {
        ModuleRegistry.resetModule(id);
      },
      resetAll: () => {
        ModuleRegistry.resetAll();
      },
      exportConfig: () => ModuleRegistry.exportConfig(),
      importConfig: (json: string) => ModuleRegistry.importConfig(json),
    }),
    [modulesState, isClient],
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    return {
      modulesState: ModuleRegistry.getAllState(),
      manifests: Object.values(MODULE_MANIFESTS),
      isLoaded: true,
      isEnabled: (id: ModuleId) => ModuleRegistry.isEnabled(id),
      getSettings: <T extends Record<string, unknown>>(id: ModuleId) => ModuleRegistry.getModuleState<T>(id).settings,
      toggleModule: (id: ModuleId) => ModuleRegistry.setEnabled(id, !ModuleRegistry.isEnabled(id)),
      setModuleEnabled: (id: ModuleId, enabled: boolean) => ModuleRegistry.setEnabled(id, enabled),
      updateSettings: <T extends Record<string, unknown>>(id: ModuleId, patch: Partial<T>) =>
        ModuleRegistry.updateSettings(id, patch),
      resetModule: (id: ModuleId) => ModuleRegistry.resetModule(id),
      resetAll: () => ModuleRegistry.resetAll(),
      exportConfig: () => ModuleRegistry.exportConfig(),
      importConfig: (json: string) => ModuleRegistry.importConfig(json),
    };
  }
  return ctx;
}

export function useModule<T extends Record<string, unknown> = Record<string, unknown>>(id: ModuleId) {
  const { isEnabled, getSettings, setModuleEnabled, toggleModule, updateSettings, resetModule } = useModules();
  const manifest = MODULE_MANIFESTS[id];

  return {
    manifest,
    isEnabled: isEnabled(id),
    settings: getSettings<T>(id),
    setEnabled: (enabled: boolean) => setModuleEnabled(id, enabled),
    toggle: () => toggleModule(id),
    updateSettings: (patch: Partial<T>) => updateSettings<T>(id, patch),
    reset: () => resetModule(id),
  };
}

interface ModuleGuardProps {
  id: ModuleId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export function ModuleGuard({ id, children, fallback, title, description }: ModuleGuardProps) {
  const { isEnabled } = useModule(id);
  const manifest = MODULE_MANIFESTS[id];

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="mx-auto my-12 max-w-2xl rounded-3xl border border-black/10 bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
        <Power className="size-8" />
      </div>
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
        Modul faolsizlantirilgan
      </span>
      <h2 className="mt-4 text-2xl font-bold text-ink">
        {title || `${manifest?.name || id} moduli o‘chirilgan`}
      </h2>
      <p className="mt-2 text-sm text-ink/65">
        {description ||
          `${manifest?.name || id} moduli administrator yoki foydalanuvchi sozlamalarida o‘chirilgan. Ushbu funksiyadan foydalanish uchun uni modullar boshqaruv markazida yoqing.`}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/settings/modules"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
        >
          <Cog className="size-4" />
          Modullarni sozlashga o‘tish
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-surface-soft px-4 py-2.5 text-sm font-semibold text-ink/75 hover:bg-black/5"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
