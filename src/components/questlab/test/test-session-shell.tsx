import * as React from "react";

import { QuestPage } from "@/components/questlab/layout/quest-page";

export function TestSessionShell({ children }: { children: React.ReactNode }) {
  return <QuestPage variant="test">{children}</QuestPage>;
}
