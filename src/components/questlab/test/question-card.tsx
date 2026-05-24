import * as React from "react";

import { Card } from "@/components/ui/card";

export function QuestionCard({ children }: { children: React.ReactNode }) {
  return <Card className="quest-detail-card">{children}</Card>;
}
