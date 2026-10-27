"use client";

import {
  ArrowDownToLine,
  ArrowUpToLine,
  BookOpen,
  BrainCircuit,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  GraduationCap,
  Languages,
  Package,
  Power,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import React, { useId, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { type ModuleCategory, useCoreKernel } from "@/core";

const iconMap: Record<string, React.ElementType> = {
  CheckCircle2,
  BrainCircuit,
  Package,
  Sparkles,
  Building2,
  GraduationCap,
  UserRound,
  BookOpen,
  Languages,
  ShieldCheck,
};

const categoryLabels: Record<ModuleCategory | "all", string> = {
  all: "Barchasi",
  core: "Asosiy (Core)",
  academic: "Ta'lim & Akademik",
  management: "Boshqaruv & Tashkilot",
  tools: "Vositalar & Generator",
  content: "Kontent & Bazalar",
};

export function ModuleSettingsClient() {
  const {
    manifests,
    isModuleEnabled,
    getSettings,
    toggleModule,
    updateSettings,
    resetModule,
    resetAll,
    exportConfig,
    importConfig,
  } = useCoreKernel();

  const isEnabled = isModuleEnabled;

  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    assessment: true,
    mastery: true,
  });
  const [importJsonText, setImportJsonText] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  const fileInputId = useId();

  const toggleExpand = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredManifests = manifests.filter((manifest) => {
    const matchesCategory = selectedCategory === "all" || manifest.category === selectedCategory;
    const matchesSearch =
      manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCount = manifests.length;
  const activeCount = manifests.filter((m) => isEnabled(m.id)).length;

  const handleExportDownload = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `questlab-modules-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(exportConfig());
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const result = importConfig(importJsonText);
    if (result.success) {
      setImportFeedback({ type: "success", text: result.message });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFeedback(null);
        setImportJsonText("");
      }, 1500);
    } else {
      setImportFeedback({ type: "error", text: result.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Yuqori sarlavha va boshqaruv tugmalari */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-ink text-white shadow-sm">
              <Sliders className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Modullar & Arxitektura Boshqaruvi
              </h1>
              <p className="text-sm text-ink/65">
                Har bir modul mustaqil ishlaydi, ularni alohida yoqish, o&apos;chirish va moslashtirish mumkin.
              </p>
            </div>
          </div>
        </div>

        {/* Global amallar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyConfig}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-black/5"
            title="Konfiguratsiyani buferga nusxalash"
          >
            {copiedExport ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            {copiedExport ? "Nusxalandi!" : "Nusxa olish"}
          </button>
          <button
            type="button"
            onClick={handleExportDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-black/5"
            title="Konfiguratsiyani JSON sifatida saqlash"
          >
            <Download className="size-3.5" />
            Eksport (JSON)
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-black/5"
            title="Konfiguratsiyani fayl yoki JSON dan yuklash"
          >
            <ArrowUpToLine className="size-3.5" />
            Import qilish
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Haqiqatan ham barcha modullarni boshlang'ich sozlamalarga qaytarmoqchimisiz?")) {
                resetAll();
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            title="Barcha sozlamalarni sukut qiymatiga qaytarish"
          >
            <RefreshCw className="size-3.5" />
            Standart holatga qaytarish
          </button>
        </div>
      </div>

      {/* Statistika ko'rsatkichlari */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-ink/50 uppercase tracking-wider">Jami Modullar</div>
          <div className="mt-1 text-2xl font-bold text-ink">{totalCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Faol Modullar</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-amber-800 uppercase tracking-wider">O&apos;chirilgan</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{totalCount - activeCount}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <div className="text-xs font-medium text-blue-800 uppercase tracking-wider">Arxitektura</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">Modulli V2</div>
        </div>
      </div>

      {/* Qidiruv va Toifalar Filteri */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Kategoriya tablari */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "core", "academic", "management", "tools", "content"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                selectedCategory === cat
                  ? "bg-ink text-white shadow-sm"
                  : "bg-surface-soft text-ink/70 hover:bg-black/5 hover:text-ink",
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Qidiruv input */}
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Modul nomi yoki ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-surface-soft py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink/40 focus:border-ink focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Modullar ro'yxati */}
      <div className="space-y-4">
        {filteredManifests.map((manifest) => {
          const enabled = isEnabled(manifest.id);
          const currentSettings = getSettings(manifest.id);
          const isExpanded = Boolean(expandedModules[manifest.id]);
          const Icon = iconMap[manifest.iconName] || Package;

          return (
            <div
              key={manifest.id}
              className={cn(
                "overflow-hidden rounded-3xl border transition shadow-sm",
                enabled ? "border-black/10 bg-white" : "border-black/6 bg-black/[0.015] opacity-85",
              )}
            >
              {/* Asosiy qator: Modul sarlavhasi, holati va toggle tugmasi */}
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm transition",
                      enabled ? "bg-ink text-white" : "bg-black/10 text-black/40",
                    )}
                  >
                    <Icon className="size-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{manifest.name}</h3>
                      <span className="rounded-md bg-black/5 px-2 py-0.5 font-mono text-[11px] text-ink/60">
                        {manifest.id}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        v{manifest.version}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                          enabled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-black/10 text-black/60",
                        )}
                      >
                        {enabled ? "Faol (Active)" : "O'chirilgan"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-medium text-ink/60">{manifest.tagline}</p>
                    <p className="mt-0.5 text-xs text-ink/45 line-clamp-2">{manifest.description}</p>
                  </div>
                </div>

                {/* Harakatlar: Toggle va Sozlamalar Expand */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Yoqish / O'chirish tugmasi */}
                  <button
                    type="button"
                    onClick={() => toggleModule(manifest.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition",
                      enabled
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-black/10 text-ink/70 hover:bg-black/20",
                    )}
                  >
                    <Power className="size-3.5" />
                    <span>{enabled ? "Yoqilgan" : "O'chirilgan"}</span>
                  </button>

                  {/* Sozlamalar kengaytmasi tugmasi */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(manifest.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black/5",
                      isExpanded ? "bg-black/5 text-ink" : "text-ink/70",
                    )}
                  >
                    <Settings className="size-3.5" />
                    <span>Sozlamalar ({manifest.settingsSchema.length})</span>
                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Kengaytirilgan Sozlamalar Paneli */}
              {isExpanded && (
                <div className="border-t border-black/8 bg-surface-soft/60 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Modulning mustaqil konfiguratsiya parametrlari
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetModule(manifest.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-ink/60 hover:bg-black/5 hover:text-ink"
                    >
                      <RefreshCw className="size-3" />
                      Standart qiymatga qaytarish
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {manifest.settingsSchema.map((field) => {
                      const value = (currentSettings as Record<string, unknown>)[field.key];

                      return (
                        <div
                          key={field.key}
                          className="flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-4 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-bold text-ink">{field.label}</label>
                              <span className="font-mono text-[10px] text-ink/40">{field.key}</span>
                            </div>
                            <p className="mt-1 text-xs text-ink/60">{field.description}</p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-black/5">
                            {field.type === "boolean" && (
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(value)}
                                  onChange={(e) => {
                                    updateSettings(manifest.id, {
                                      [field.key]: e.target.checked,
                                    });
                                  }}
                                  className="size-4 rounded border-black/20 text-ink focus:ring-ink"
                                />
                                <span className="text-xs font-semibold text-ink/80">
                                  {value ? "Ruxsat etilgan / Yoqilgan" : "O'chirilgan"}
                                </span>
                              </label>
                            )}

                            {field.type === "number" && (
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  value={Number(value ?? field.defaultValue)}
                                  min={field.min}
                                  max={field.max}
                                  step={field.step || 1}
                                  onChange={(e) => {
                                    updateSettings(manifest.id, {
                                      [field.key]: Number(e.target.value),
                                    });
                                  }}
                                  className="w-24 rounded-xl border border-black/15 bg-surface-soft px-3 py-1.5 text-xs font-semibold text-ink focus:border-ink focus:bg-white focus:outline-none"
                                />
                                {typeof field.min === "number" && typeof field.max === "number" && (
                                  <span className="text-[11px] text-ink/40">
                                    Oraliq: {field.min} - {field.max}
                                  </span>
                                )}
                              </div>
                            )}

                            {field.type === "select" && field.options && (
                              <select
                                value={String(value ?? field.defaultValue)}
                                onChange={(e) => {
                                  updateSettings(manifest.id, {
                                    [field.key]: e.target.value,
                                  });
                                }}
                                className="w-full rounded-xl border border-black/15 bg-surface-soft px-3 py-1.5 text-xs font-semibold text-ink focus:border-ink focus:bg-white focus:outline-none"
                              >
                                {field.options.map((opt) => (
                                  <option key={String(opt.value)} value={String(opt.value)}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}

                            {field.type === "string" && (
                              <input
                                type="text"
                                value={String(value ?? field.defaultValue)}
                                onChange={(e) => {
                                  updateSettings(manifest.id, {
                                    [field.key]: e.target.value,
                                  });
                                }}
                                className="w-full rounded-xl border border-black/15 bg-surface-soft px-3 py-1.5 text-xs font-semibold text-ink focus:border-ink focus:bg-white focus:outline-none"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredManifests.length === 0 && (
          <div className="rounded-3xl border border-black/10 bg-white p-12 text-center text-ink/60">
            Qidiruv mezonlariga mos keladigan modul topilmadi.
          </div>
        )}
      </div>

      {/* JSON Import qilish modali */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Modullar Konfiguratsiyasini Import Qilish</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl p-1 text-ink/50 hover:bg-black/5 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-ink/65">
              Ilgari eksport qilingan JSON konfiguratsiyasini kiriting yoki fayl yuklang.
            </p>

            <div className="mt-4">
              <label
                htmlFor={fileInputId}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/20 bg-surface-soft px-4 py-2 text-xs font-semibold text-ink/75 hover:bg-black/5"
              >
                <ArrowDownToLine className="size-3.5" />
                Fayldan yuklash (.json)
              </label>
              <input
                id={fileInputId}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="mt-3">
              <textarea
                rows={8}
                placeholder="JSON matnini shu yerga qo'ying..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full rounded-2xl border border-black/15 bg-surface-soft p-3 font-mono text-xs text-ink focus:border-ink focus:bg-white focus:outline-none"
              />
            </div>

            {importFeedback && (
              <div
                className={cn(
                  "mt-3 rounded-xl p-3 text-xs font-semibold",
                  importFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800",
                )}
              >
                {importFeedback.text}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-black/5"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importJsonText.trim()}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand disabled:opacity-50"
              >
                Qo&apos;llash va saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
