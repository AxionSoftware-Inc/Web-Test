export type ModuleId =
  | "assessment"
  | "mastery"
  | "exam-packs"
  | "test-generator"
  | "schools"
  | "teacher"
  | "student"
  | "learning"
  | "localization"
  | "auth";

export type ModuleCategory = "core" | "academic" | "management" | "tools" | "content";

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
  id: ModuleId;
  name: string;
  tagline: string;
  description: string;
  category: ModuleCategory;
  version: string;
  iconName: string;
  defaultEnabled: boolean;
  defaultSettings: TConfig;
  settingsSchema: Array<SettingFieldDefinition>;
}

export interface ModuleState<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  enabled: boolean;
  settings: TConfig;
  updatedAt: string;
}

export type AllModulesState = Partial<Record<ModuleId, ModuleState>>;

export interface ModuleExportPayload {
  version: string;
  exportedAt: string;
  modules: AllModulesState;
}
