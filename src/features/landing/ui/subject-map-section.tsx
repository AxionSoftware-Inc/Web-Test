import Link from "next/link";
import { BookOpen, LayoutDashboard, Target, TriangleAlert } from "lucide-react";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const cards = [
  { title: "Tests", href: "/tests", icon: LayoutDashboard, copy: "Published backend tests." },
  { title: "Subjects", href: "/subjects", icon: BookOpen, copy: "Fan va mavzuni tanlang." },
  { title: "Practice", href: "/practice", icon: Target, copy: "Zaif skilllarni mashq qiling." },
  { title: "Mistakes", href: "/student/mistakes", icon: TriangleAlert, copy: "Xatolar va zaif skilllar." },
];

export function SubjectMapSection() {
  return (
    <section id="modules" className="bg-white">
      <Container className="py-12">
        <div className="mb-7">
          <SectionHeading eyebrow="Boshlash" title="Kerakli yo‘nalishni tanlang" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="flex min-h-[165px] flex-col justify-between rounded-3xl border border-black/8 bg-surface-soft p-5 hover:bg-white">
                <Icon className="size-6 text-brand" />
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
