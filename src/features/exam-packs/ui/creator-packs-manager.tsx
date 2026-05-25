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
      {notice ? <p className="rounded-[var(--radius-card)] border border-success-soft bg-success-soft px-4 py-3 text-sm font-semibold text-success">{notice}</p> : null}
      {error ? <p className="rounded-[var(--radius-card)] border border-danger-soft bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}
      {packs.length ? (
        <div className="quest-card-grid-3">
          {packs.map((pack) => {
            const usage = usageBySlug[pack.slug];
            return (
              <Card key={pack.slug} className="flex min-h-[220px] flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold">{pack.title}</h3>
                    <p className="mt-1 text-sm text-muted">{pack.exam_type || "Pack"}</p>
                  </div>
                  <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "inactive"}</Badge>
                </div>
                {pack.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{pack.description}</p> : null}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Tests" value={pack.item_count} />
                  <MiniStat label="Usage" value={usage?.attempts ?? 0} />
                  <MiniStat label="Avg" value={`${usage?.average_score ?? 0}%`} />
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/exam-packs/${pack.slug}`}>
                    <Pencil className="size-4" />
                    Edit
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/creator/packs/${pack.slug}`}>
                    <ExternalLink className="size-4" />
                    Open
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void deletePack(pack)}
                    disabled={busySlug === pack.slug}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-8 text-center text-sm font-semibold text-muted">Pack topilmadi.</div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-surface-soft px-3 py-3">
      <p className="text-base font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
    </div>
  );
}
