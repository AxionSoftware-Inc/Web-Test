import { architectureLayers } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function ArchitectureSection() {
  return (
    <section id="architecture" className="border-y border-black/10 bg-white">
      <Container className="grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Architecture direction"
          title="Next.js hozir, platforma arxitekturasi keyin."
          copy="Boshlanishi Next.js App Router: tez UI, server components, SEO va dashboardlar. Domen logikasi esa features, entities, shared chegaralari bilan yoziladi, shunda backend ajralganda kod ko'chirish oson bo'ladi."
        />
        <div className="grid gap-3">
          {architectureLayers.map((item, index) => (
            <div key={item} className="flex items-center gap-4 rounded-md bg-[#f7f7f2] p-4">
              <span className="grid size-8 place-items-center rounded bg-[#151713] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
