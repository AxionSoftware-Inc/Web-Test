import * as React from "react";

export function SectionHeader({ title, copy, actions }: { title: React.ReactNode; copy?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {copy ? <p className="mt-1 text-sm text-muted">{copy}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
