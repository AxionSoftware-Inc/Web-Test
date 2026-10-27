"use client";

import { Cog, Power } from "lucide-react";
import Link from "next/link";
import React, { createContext, useContext, useSyncExternalStore } from "react";

import { CoreKernel } from "./core-kernel";
import type {
  AllModulesRegistryState,
  CoreModuleId,
  ModuleManifest,
  ModuleNavItem,
} from "./types";

interface CoreKernelContextValue {
  state: AllModulesRegistryState;
  manifests: ModuleManifest[];
  isLoaded: boolean;
  isModuleEnabled: (id: CoreModuleId) => boolean;
  getSettings: <T extends Record<string, unknown>>(id: CoreModuleId) => T;
  toggleModule: (id: CoreModuleId) => void;
  setModuleEnabled: (id: CoreModuleId, enabled: boolean) => void;
  updateSettings: <T extends Record<string, unknown>>(id: CoreModuleId, patch: Partial<T>) => void;
  resetModule: (id: CoreModuleId) => void;
  resetAll: () => void;
  exportConfig: () => string;
  importConfig: (jsonString: string) => { success: boolean; message: string };
  getNavItems: (role: "student" | "teacher" | "school" | "creator" | "admin" | "public") => ModuleNavItem[];
  checkRoute: (pathname: string) => { allowed: boolean; moduleId?: CoreModuleId; moduleName?: string };
}

const CoreKernelContext = createContext<CoreKernelContextValue | null>(null);

function subscribe(callback: () => void) {
  return CoreKernel.subscribe(callback);
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "{}";
  return JSON.stringify(CoreKernel.getState());
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

export function CoreKernelProvider({ children }: { children: React.ReactNode }) {
  const rawState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getClientServerSnapshot);

  const state: AllModulesRegistryState = React.useMemo(() => {
    try {
      return JSON.parse(rawState) as AllModulesRegistryState;
    } catch {
      return CoreKernel.getState();
    }
  }, [rawState]);

  const value: CoreKernelContextValue = React.useMemo(
    () => ({
      state,
      manifests: CoreKernel.getManifests(),
      isLoaded: isClient,
      isModuleEnabled: (id: CoreModuleId) => {
        const item = state[id];
        return item ? item.enabled : (CoreKernel.getManifest(id)?.defaultEnabled ?? true);
      },
      getSettings: <T extends Record<string, unknown>>(id: CoreModuleId): T => {
        const manifest = CoreKernel.getManifest(id);
        const item = state[id];
        return { ...(manifest?.defaultSettings || {}), ...(item?.settings || {}) } as T;
      },
      toggleModule: (id: CoreModuleId) => {
        CoreKernel.toggleModule(id);
      },
      setModuleEnabled: (id: CoreModuleId, enabled: boolean) => {
        CoreKernel.setModuleEnabled(id, enabled);
      },
      updateSettings: <T extends Record<string, unknown>>(id: CoreModuleId, patch: Partial<T>) => {
        CoreKernel.updateModuleSettings(id, patch);
      },
      resetModule: (id: CoreModuleId) => {
        CoreKernel.resetModule(id);
      },
      resetAll: () => {
        CoreKernel.resetAll();
      },
      exportConfig: () => {
        return CoreKernel.exportConfig();
      },
      importConfig: (jsonString: string) => {
        return CoreKernel.importConfig(jsonString);
      },
      getNavItems: (role) => {
        return CoreKernel.getNavItemsFor(role);
      },
      checkRoute: (pathname) => {
        return CoreKernel.isRouteActive(pathname);
      },
    }),
    [state, isClient],
  );

  return <CoreKernelContext.Provider value={value}>{children}</CoreKernelContext.Provider>;
}

export function useCoreKernel() {
  const ctx = useContext(CoreKernelContext);
  if (!ctx) {
    return {
      state: CoreKernel.getState(),
      manifests: CoreKernel.getManifests(),
      isLoaded: true,
      isModuleEnabled: (id: CoreModuleId) => CoreKernel.isModuleEnabled(id),
      getSettings: <T extends Record<string, unknown>>(id: CoreModuleId) =>
        CoreKernel.getModuleState<T>(id).settings,
      toggleModule: (id: CoreModuleId) => CoreKernel.toggleModule(id),
      setModuleEnabled: (id: CoreModuleId, enabled: boolean) => CoreKernel.setModuleEnabled(id, enabled),
      updateSettings: <T extends Record<string, unknown>>(id: CoreModuleId, patch: Partial<T>) =>
        CoreKernel.updateModuleSettings(id, patch),
      resetModule: (id: CoreModuleId) => CoreKernel.resetModule(id),
      resetAll: () => CoreKernel.resetAll(),
      exportConfig: () => CoreKernel.exportConfig(),
      importConfig: (jsonString: string) => CoreKernel.importConfig(jsonString),
      getNavItems: (role: "student" | "teacher" | "school" | "creator" | "admin" | "public") =>
        CoreKernel.getNavItemsFor(role),
      checkRoute: (pathname: string) => CoreKernel.isRouteActive(pathname),
    };
  }
  return ctx;
}

export function useCoreModule<T extends Record<string, unknown> = Record<string, unknown>>(
  id: CoreModuleId,
) {
  const { isModuleEnabled, getSettings, setModuleEnabled, toggleModule, updateSettings, resetModule } =
    useCoreKernel();
  const manifest = CoreKernel.getManifest(id);

  return {
    manifest,
    isEnabled: isModuleEnabled(id),
    settings: getSettings<T>(id),
    setEnabled: (enabled: boolean) => setModuleEnabled(id, enabled),
    toggle: () => toggleModule(id),
    updateSettings: (patch: Partial<T>) => updateSettings<T>(id, patch),
    reset: () => resetModule(id),
  };
}

export function useCoreNavigation(role: "student" | "teacher" | "school" | "creator" | "admin" | "public") {
  const { getNavItems } = useCoreKernel();
  return getNavItems(role);
}

interface CoreModuleGuardProps {
  id: CoreModuleId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export function CoreModuleGuard({ id, children, fallback, title, description }: CoreModuleGuardProps) {
  const { isEnabled, manifest } = useCoreModule(id);

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
          `${manifest?.name || id} moduli hozirda faolsiz holatda. Ushbu xizmatdan foydalanish uchun uni modullar boshqaruv markazida yoqing.`}
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
