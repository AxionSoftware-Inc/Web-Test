import Link from "next/link";
import { BookOpen, Calculator, GraduationCap, PackageCheck, TriangleAlert } from "lucide-react";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const cards = [
  { title: "Algebra", href: "/subjects/mathematics/topics/algebra", icon: Calculator, copy: "Daraja bo‘yicha backend testlar." },
  { title: "Question bank", href: "/questions", icon: BookOpen, copy: "Testlardan ajralgan savollar." },
  { title: "Mistakes", href: "/mistakes", icon: TriangleAlert, copy: "Wrong answers va weak skills." },
  { title: "Teacher", href: "/teacher/classes", icon: GraduationCap, copy: "Class va student results." },
  { title: "Exam packs", href: "/exam-packs", icon: PackageCheck, copy: "Pullik/to‘plam testlar." },
];

export function SubjectMapSection() {
  return (
    <section id="subjects" className="bg-white">
      <Container className="py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow="Start here" title="Asosiy modullar" copy="Hozir backend bilan ishlaydigan MVP yo‘llari." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="flex min-h-[170px] flex-col justify-between rounded-3xl border border-black/8 bg-[#fbfbf6] p-5 hover:bg-white">
                <Icon className="size-6 text-[#276a5b]" />
                <div>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-black/55">{card.copy}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
