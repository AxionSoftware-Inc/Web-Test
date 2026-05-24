import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva("inline-flex w-fit items-center rounded-lg px-2 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-neutral-soft text-neutral",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      info: "bg-info-soft text-info",
      student: "bg-student-soft text-student",
      teacher: "bg-teacher-soft text-teacher",
      school: "bg-school-soft text-school",
      creator: "bg-creator-soft text-creator",
      admin: "bg-admin-soft text-admin",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
