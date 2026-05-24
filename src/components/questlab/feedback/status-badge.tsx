import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

function variantForStatus(status: string): BadgeProps["variant"] {
  const value = status.toLowerCase().replace(/\s+/g, "_");
  if (["assigned", "info", "available", "review"].includes(value)) return "info";
  if (["in_progress", "pending", "active"].includes(value)) return "warning";
  if (["completed", "mastery", "done", "correct", "published"].includes(value)) return "success";
  if (["failed", "expired", "weak", "wrong"].includes(value)) return "danger";
  if (["student"].includes(value)) return "student";
  if (["teacher"].includes(value)) return "teacher";
  if (["school"].includes(value)) return "school";
  if (["creator"].includes(value)) return "creator";
  if (["admin"].includes(value)) return "admin";
  return "default";
}

export function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  return <Badge variant={variantForStatus(status)}>{children ?? status}</Badge>;
}
