import * as React from "react";

export function PageHeader({
  eyebrow: _eyebrow,
  title: _title,
  copy: _copy,
  actions: _actions,
  className: _className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  copy?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  // Design rule: dashboard/page headers are intentionally disabled globally.
  // Do not reintroduce page-level header blocks; use section-level context instead.
  void _eyebrow;
  void _title;
  void _copy;
  void _actions;
  void _className;
  return null;
}
