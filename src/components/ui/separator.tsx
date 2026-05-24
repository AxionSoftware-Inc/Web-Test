import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-line", className)} {...props} />;
}
