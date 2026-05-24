import { Timer } from "lucide-react";

export function TimerPill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-3 py-2 text-sm font-semibold text-white">
      <Timer className="size-4" />
      {value}
    </span>
  );
}
