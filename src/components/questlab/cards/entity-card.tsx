import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/questlab/feedback/status-badge";

export function EntityCard({
  title,
  meta,
  href,
  action = "Open",
  status,
  stats,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  href: string;
  action?: React.ReactNode;
  status?: string;
  stats?: React.ReactNode[];
}) {
  return (
    <Card className="quest-entity-card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{title}</h3>
          {meta ? <p className="mt-1 line-clamp-2 text-sm text-muted">{meta}</p> : null}
        </div>
        {status ? <StatusBadge status={status}>{status}</StatusBadge> : null}
      </div>
      {stats?.length ? <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">{stats.map((item, index) => <span key={index} className="rounded-lg bg-neutral-soft px-2 py-1">{item}</span>)}</div> : null}
      <Button asChild size="sm" className="mt-auto w-fit">
        <Link href={href}>{action}</Link>
      </Button>
    </Card>
  );
}
