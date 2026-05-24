import { learningLoop } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function LearningLoopSection() {
  return (
    <section id="learning-loop">
      <Container className="py-14">
        <SectionHeading
          eyebrow="Learning loop"
          title="Platformaning yuragi: diagnose, guide, practice, review."
          copy="Maqsad faqat savol berish emas. Har bir attempt keyingi tavsiyaga ta'sir qiladi."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {learningLoop.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-black/10 bg-white p-5">
              <span className="grid size-9 place-items-center rounded-md bg-brand text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/62">{step.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
