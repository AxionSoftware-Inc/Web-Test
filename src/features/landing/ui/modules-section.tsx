import { platformModules } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function ModulesSection() {
  return (
    <section id="modules">
      <Container className="py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Product modules"
            title="Birinchi versiyadan kengayishga tayyor."
          />
          <p className="max-w-xl text-sm leading-6 text-black/60">
            Har modul keyinchalik alohida backend service yoki package sifatida
            ajralishi mumkin, lekin MVP uchun monorepo ichida aniq chegaralar
            bilan yuradi.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformModules.map((module) => (
            <article key={module.title} className="rounded-lg border border-black/10 bg-white p-5">
              <h3 className="text-lg font-semibold">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/62">{module.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
