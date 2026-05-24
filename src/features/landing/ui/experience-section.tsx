import { experiencePanels } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function ExperienceSection() {
  return (
    <section id="experience" className="border-y border-black/10 bg-[#fcfcf7]">
      <Container className="grid gap-8 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <SectionHeading
          eyebrow="Platform surfaces"
          title="Bitta mahsulot, lekin rollar bo'yicha alohida tajriba."
          copy="Learner, creator va organization ekranlari alohida feature modullar sifatida rivojlanadi."
        />
        <div className="grid gap-4">
          {experiencePanels.map((panel) => (
            <article key={panel.title} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold">{panel.title}</h3>
                <span className="w-fit rounded-md bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                  Module
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-black/62">{panel.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
