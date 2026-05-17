import Link from "next/link";
import { BookOpen, GraduationCap, LayoutDashboard, PackageCheck, TriangleAlert } from "lucide-react";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const cards = [
  { title: "Tests", href: "/tests", icon: LayoutDashboard, copy: "Published backend tests." },
  { title: "Mistakes", href: "/mistakes", icon: TriangleAlert, copy: "Wrong answers and weak skills." },
  { title: "Questions", href: "/questions", icon: BookOpen, copy: "Question bank with LaTeX." },
  { title: "Teacher", href: "/teacher/classes", icon: GraduationCap, copy: "Classes, assignments, results." },
  { title: "Classes", href: "/classes", icon: GraduationCap, copy: "Public class catalog." },
  { title: "Exam packs", href: "/exam-packs", icon: PackageCheck, copy: "Paid or private test packs." },
];

export function SubjectMapSection() {
  return (
    <section id="modules" className="bg-white">
      <Container className="py-12">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow="Modules" title="Backend bilan ishlaydigan asosiy yo‘llar" />
          <Link href="/crud" className="rounded-2xl border border-black/10 bg-[#fbfbf6] px-5 py-3 text-sm font-semibold">
            Add test
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="flex min-h-[165px] flex-col justify-between rounded-3xl border border-black/8 bg-[#fbfbf6] p-5 hover:bg-white">
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
