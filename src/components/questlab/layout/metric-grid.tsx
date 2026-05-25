import * as React from "react";

export function MetricGrid({ children: _children, className: _className }: { children: React.ReactNode; className?: string }) {
  // Design rule: top summary metric rows are disabled globally.
  // Do not add page-level numeric card rows under headers.
  void _children;
  void _className;
  return null;
}
