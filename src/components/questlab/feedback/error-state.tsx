import * as React from "react";

export function ErrorState({ title = "Something went wrong", copy }: { title?: React.ReactNode; copy?: React.ReactNode }) {
  return (
    <div className="quest-card p-4">
      <p className="text-sm font-semibold text-danger">{title}</p>
      {copy ? <p className="mt-1 text-sm text-muted">{copy}</p> : null}
    </div>
  );
}
