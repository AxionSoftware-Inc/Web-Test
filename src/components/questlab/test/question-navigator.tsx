import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function QuestionNavigator({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn("quest-card p-4", className)}>{children}</aside>;
}
