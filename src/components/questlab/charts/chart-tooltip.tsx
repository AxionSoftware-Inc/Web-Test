export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; payload?: { meta?: string } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 text-muted">{item.value}</p>
      {item.payload?.meta ? <p className="mt-1 text-subtle">{item.payload.meta}</p> : null}
    </div>
  );
}
