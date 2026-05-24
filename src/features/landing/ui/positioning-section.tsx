import Link from "next/link";
import { Building2, GraduationCap, PackageCheck } from "lucide-react";

import { Container } from "@/shared/ui/container";

const products = [
  { title: "Teacher", href: "/teacher/classes", icon: GraduationCap, copy: "Class ochish, test berish, natijalarni ko‘rish." },
  { title: "School", href: "/schools", icon: Building2, copy: "Learning center va school positioning uchun tayyor yo‘l." },
  { title: "Exam packs", href: "/exam-packs", icon: PackageCheck, copy: "DTM, SAT yoki university packlarni alohida sotish." },
];

export function PositioningSection() {
  return (
    <section className="bg-background">
      <Container className="py-12">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          <div className="rounded-[28px] border border-black/8 bg-ink p-6 text-white shadow-[0_18px_55px_rgba(21,23,19,0.10)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Positioning</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Faqat test emas. Bilimdagi bo‘shliqni topadigan platforma.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/64">
              Har testdan keyin user nimani bilishi, nimani bilmasligi va keyin qaysi mashqni ishlashi kerakligi ko‘rinadi.
            </p>
            <Link href="/mistakes" className="mt-6 inline-block rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-ink">
              Open diagnosis
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {products.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.06)] hover:bg-surface-soft">
                  <Icon className="size-6 text-brand" />
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/58">{item.copy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
