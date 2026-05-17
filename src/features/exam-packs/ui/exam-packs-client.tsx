"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiExamPack } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getPackManageCode, savePackManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function ExamPacksClient({ initialPacks }: { initialPacks: ApiExamPack[] }) {
  const [packs, setPacks] = useState(initialPacks);
  const [title, setTitle] = useState("DTM Algebra Pack");
  const [examType, setExamType] = useState("DTM Math");
  const [description, setDescription] = useState("Algebra bo'yicha tayyor testlar to'plami.");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [accessCode, setAccessCode] = useState("2026");
  const [priceLabel, setPriceLabel] = useState("99 000 so'm");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createPack() {
    setSaving(true);
    setError("");
    try {
      const pack = await questApi.createExamPack({
        title,
        slug: `${slugify(title)}-${Date.now().toString().slice(-4)}`,
        description,
        exam_type: examType,
        visibility,
        access_code: visibility === "private" ? accessCode : "",
        manage_code: getPackManageCode(),
        price_label: priceLabel,
        is_active: true,
      });
      savePackManageCode(pack.slug, pack.manage_code);
      setPacks((items) => [pack, ...items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exam pack create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <PremiumPanel>
        <Eyebrow>Exam pack</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create pack</h1>
        <div className="mt-6 grid gap-4">
          <Input label="Pack title" value={title} onChange={setTitle} />
          <Input label="Exam type" value={examType} onChange={setExamType} />
          <Input label="Price label" value={priceLabel} onChange={setPriceLabel} />
          <FieldShell label="Visibility">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className={premiumInputClass}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </FieldShell>
          {visibility === "private" ? <Input label="Access code" value={accessCode} onChange={setAccessCode} /> : null}
          <FieldShell label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={premiumInputClass} />
          </FieldShell>
          <button onClick={createPack} disabled={saving} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Creating..." : "Create exam pack"}
          </button>
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <h2 className="text-2xl font-semibold">Exam packs</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {packs.map((pack) => (
            <Link key={pack.id} href={`/exam-packs/${pack.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf8]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{pack.title}</p>
                  <p className="mt-1 text-sm text-black/52">{pack.exam_type}</p>
                </div>
                <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-xs font-semibold text-[#276a5b]">{pack.price_label || "Free"}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-black/58">{pack.description}</p>
              <p className="mt-5 text-xs font-semibold text-black/45">{pack.item_count} tests / {pack.visibility}</p>
            </Link>
          ))}
        </div>
      </PremiumPanel>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldShell label={label}>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} />
    </FieldShell>
  );
}
