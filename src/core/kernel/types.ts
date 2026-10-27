export type CoreModuleId =
  | "school"
  | "creator"
  | "teacher"
  | "student"
  | "assessment"
  | "mastery"
  | "exam-packs"
  | "test-generator"
  | "learning"
  | "localization"
  | "auth";

export type ModuleCategory = "core" | "academic" | "management" | "tools" | "content";

export interface ModuleNavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  roles?: Array<"student" | "teacher" | "school" | "creator" | "admin" | "public">;
  badge?: string;
  order?: number;
  isAction?: boolean;
}

export type SettingFieldType = "boolean" | "number" | "string" | "select";

export interface SettingFieldDefinition<T = unknown> {
  key: string;
  label: string;
  description: string;
  type: SettingFieldType;
  defaultValue: T;
  options?: Array<{ label: string; value: string | number }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface ModuleManifest<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  id: CoreModuleId;
  name: string;
  tagline: string;
  description: string;
  version: string;
  category: ModuleCategory;
  iconName: string;
  defaultEnabled: boolean;
  defaultSettings: TConfig;
  settingsSchema: Array<SettingFieldDefinition>;
  navItems: ModuleNavItem[];
  routePrefixes: string[];
  dependencies?: CoreModuleId[];
}

export interface ModuleState<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  enabled: boolean;
  settings: TConfig;
  updatedAt: string;
}

export type AllModulesRegistryState = Partial<Record<CoreModuleId, ModuleState>>;

export interface ModuleExportPayload {
  version: string;
  exportedAt: string;
  modules: AllModulesRegistryState;
}

export interface CoreEvent<T = unknown> {
  type: string;
  moduleId: CoreModuleId | "core";
  payload: T;
  timestamp: number;
}

export type CoreEventListener<T = unknown> = (event: CoreEvent<T>) => void;
