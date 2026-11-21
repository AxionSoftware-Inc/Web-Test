"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      {notice ? <p className="rounded-xl border border-success/20 bg-success-soft px-4 py-2.5 text-sm font-semibold text-success">{notice}</p> : null}
      {error ? <p className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{error}</p> : null}
      {packs.length ? (
        <div className="quest-card-grid-3">
          {packs.map((pack) => {
            const usage = usageBySlug[pack.slug];
            return (
              <Card key={pack.slug} className="group flex min-h-[200px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-4.5 shadow-sm transition hover:border-black/20">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-brand transition-colors">{pack.title}</h3>
                      <p className="mt-0.5 text-xs text-black/50">{pack.exam_type || "Pack"}</p>
                    </div>
                    <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "inactive"}</Badge>
                  </div>
                  {pack.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/60">{pack.description}</p> : null}
                </div>
                <div>
                  <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Testlar" value={pack.item_count} />
                    <MiniStat label="Topshirildi" value={usage?.attempts ?? 0} />
                    <MiniStat label="O'rtacha" value={`${usage?.average_score ?? 0}%`} />
                  </div>
                  <div className="mt-3.5 grid grid-cols-3 gap-2">
                    <Button asChild variant="secondary" size="sm" className="rounded-xl">
                      <Link href={`/exam-packs/${pack.slug}`}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="rounded-xl">
                      <Link href={`/creator/packs/${pack.slug}`}>
                        <ExternalLink className="size-3.5" />
                        Ochish
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void deletePack(pack)}
                      disabled={busySlug === pack.slug}
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                    >
                      <Trash2 className="size-3.5" />
                      O&apos;chirish
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/12 bg-[#fafaf8] p-8 text-center text-sm font-semibold text-black/50">Pack topilmadi.</div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[#fafaf8] border border-black/4 px-2.5 py-2">
      <p className="text-sm font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
    </div>
  );
}
