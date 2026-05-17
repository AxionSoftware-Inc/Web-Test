import Link from "next/link";
import { BookOpenCheck, Building2, GraduationCap, RotateCcw, SearchCheck, Target } from "lucide-react";

import { Container } from "@/shared/ui/container";

const loop = [
  { title: "Test", copy: "Skill-tagged savollar yechiladi.", icon: SearchCheck },
  { title: "Diagnose", copy: "Natija skill va topic bo‘yicha ajraladi.", icon: Target },
  { title: "Fix", copy: "Mistake bank keyingi mashqni ko‘rsatadi.", icon: RotateCcw },
];

const modules = [
  { title: "Teacher", href: "/teacher/classes", icon: GraduationCap, copy: "Class ochish, test biriktirish, student natijalarini ko‘rish." },
  { title: "Exam Packs", href: "/exam-packs", icon: BookOpenCheck, copy: "DTM/SAT/University pack yaratish va natija olish." },
  { title: "Schools", href: "/schools", icon: Building2, copy: "Keyingi bosqich uchun learning center positioning." },
];

export function PositioningSection() {
  return (
    <section className="bg-[#f7f7f2]">
      <Container className="py-10">
        <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">Positioning</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                Faqat test emas. Bilimdagi aniq boshliqni topadigan va tuzatadigan platforma.
              </h2>
              <p className="mt-4 text-sm leading-6 text-black/62">
                Har testdan keyin user nimani bilishi, nimani bilmasligi va qaysi mashq bilan tuzatishi kerakligi ko‘rinadi.
              </p>
              <Link href="/mistakes" className="mt-6 inline-block rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
                Open mistake bank
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {loop.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-black/8 bg-[#fbfbf6] p-4">
                    <Icon className="size-5 text-[#276a5b]" />
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/58">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_12px_35px_rgba(21,23,19,0.05)] hover:bg-[#fbfbf6]">
                <Icon className="size-6 text-[#276a5b]" />
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/58">{item.copy}</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
