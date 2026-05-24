"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ApiExamPack } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getPackManageCode } from "@/shared/model/local-identity";

type PackUsage = { attempts: number; students_submitted: number; average_score: number };

export function CreatorPacksManager({ initialPacks, usageBySlug }: { initialPacks: ApiExamPack[]; usageBySlug: Record<string, PackUsage> }) {
  const [packs, setPacks] = useState(initialPacks);
  const [busySlug, setBusySlug] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function deletePack(pack: ApiExamPack) {
    const confirmed = window.confirm(`${pack.title} packini o'chirasizmi? Natijasi bor pack o'chmaydi, faqat inactive bo'ladi.`);
    if (!confirmed) return;
    setBusySlug(pack.slug);
    setNotice("");
    setError("");
    try {
      const deleted = await questApi.deleteExamPack(pack.slug, pack.manage_code || getPackManageCode(pack.slug));
      if (deleted) {
        setPacks((current) => current.map((item) => (item.slug === deleted.slug ? deleted : item)));
        setNotice(`${deleted.title} inactive qilindi, chunki unga bog'langan sessionlar bor.`);
      } else {
        setPacks((current) => current.filter((item) => item.slug !== pack.slug));
        setNotice(`${pack.title} o'chirildi.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack delete failed.");
    } finally {
      setBusySlug("");
    }
  }

  return (
    <div className="grid gap-4">
      {notice ? <p className="rounded-2xl border border-[#bfe8d8] bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">{notice}</p> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {packs.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packs.map((pack) => {
            const usage = usageBySlug[pack.slug];
            return (
              <article key={pack.slug} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{pack.title}</h3>
                    <p className="mt-1 text-sm text-black/50">{pack.exam_type || "Pack"}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{pack.is_active ? "published" : "inactive"}</span>
                </div>
                {pack.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55">{pack.description}</p> : null}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Tests" value={pack.item_count} />
                  <MiniStat label="Usage" value={usage?.attempts ?? 0} />
                  <MiniStat label="Avg" value={`${usage?.average_score ?? 0}%`} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Link href={`/exam-packs/${pack.slug}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold hover:bg-surface-soft">
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                  <Link href={`/creator/packs/${pack.slug}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold hover:bg-surface-soft">
                    <ExternalLink className="size-4" />
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => void deletePack(pack)}
                    disabled={busySlug === pack.slug}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-black/12 bg-white/70 p-8 text-center text-sm font-semibold text-black/45">Pack topilmadi.</div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-soft px-3 py-3">
      <p className="text-base font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{label}</p>
    </div>
  );
}
