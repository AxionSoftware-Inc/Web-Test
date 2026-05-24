import { roadmap } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function RoadmapSection() {
  return (
    <section id="roadmap">
      <Container className="py-14">
        <div className="rounded-lg bg-ink p-6 text-white sm:p-8">
          <SectionHeading
            eyebrow="Build roadmap"
            title="MVPdan global platformagacha."
            light
          />
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((step, index) => (
              <div key={step} className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/45">Phase {index + 1}</p>
                <p className="mt-2 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
