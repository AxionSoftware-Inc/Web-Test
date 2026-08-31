import { Check, CircleDot, Layers3 } from "lucide-react";

import { Container } from "@/shared/ui/container";

const signals = [
  { icon: CircleDot, label: "One clear loop", copy: "Test → understand → practice" },
  { icon: Check, label: "Feedback in context", copy: "Every result points to a next step" },
  { icon: Layers3, label: "Built for teams", copy: "Learners, teachers and centers" },
];

export function TrustStrip() {
  return (
    <section aria-label="QuestLab principles" className="border-b border-line bg-white">
      <Container className="!max-w-[1180px] py-5 sm:py-6">
        <div className="grid gap-4 md:grid-cols-3 md:divide-x md:divide-ink/8">
          {signals.map(({ icon: Icon, label, copy }) => (
            <div key={label} className="flex items-center gap-3 md:px-6 first:md:pl-0 last:md:pr-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="mt-0.5 text-xs text-ink/48">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
