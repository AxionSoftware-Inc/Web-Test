"use client";

import { ArrowUpRight, Atom, BookOpen, Code2, Target } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { useTranslation } from "@/shared/i18n/i18n-context";

export function SubjectMapSection() {
  const { locale, t } = useTranslation();

  const data = {
    uz: {
      eyebrow: "Platformani o'rganing",
      title: "O'zingizga qiziq yo'nalishdan boshlang.",
      copy: "Har bir yo'nalish siz erishmoqchi bo'lgan maqsadga mos tarzda tashkil etilgan.",
      viewAll: "Barcha testlarni ko'rish",
      paths: [
        { title: "Matematika", copy: "Algebra, hisoblash va mantiqiy masalalar.", meta: "Asosiy poydevor", href: "/subjects/mathematics", icon: BookOpen, tone: "bg-brand-soft text-brand" },
        { title: "Fizika", copy: "Mexanika va har bir formula mohiyati.", meta: "Chuqur tushunish", href: "/tests/physics-mechanics-beginner", icon: Atom, tone: "bg-[#eef4ff] text-[#315f9f]" },
        { title: "Dasturlash", copy: "Massivlar, algoritmlar va amaliy mantiq.", meta: "Mantiqni charxlang", href: "/tests/programming-arrays-intermediate", icon: Code2, tone: "bg-[#fff4e8] text-[#9a5a20]" },
        { title: "Kuchsiz mavzular", copy: "Ko'proq mashq talab qiladigan ko'nikmalar.", meta: "To'xtagan joydan davom eting", href: "/practice", icon: Target, tone: "bg-[#f1efff] text-[#5b4db7]" },
      ],
    },
    ru: {
      eyebrow: "Исследуйте платформу",
      title: "Начните с интересующего вас направления.",
      copy: "Каждое направление структурировано под цели вашего прогресса.",
      viewAll: "Смотреть все тесты",
      paths: [
        { title: "Математика", copy: "Алгебра, вычисления и решение задач.", meta: "Фундаментальные навыки", href: "/subjects/mathematics", icon: BookOpen, tone: "bg-brand-soft text-brand" },
        { title: "Физика", copy: "Механика и понимание сути формул.", meta: "Глубокое понимание", href: "/tests/physics-mechanics-beginner", icon: Atom, tone: "bg-[#eef4ff] text-[#315f9f]" },
        { title: "Программирование", copy: "Массивы, алгоритмы и практическая логика.", meta: "Логическое мышление", href: "/tests/programming-arrays-intermediate", icon: Code2, tone: "bg-[#fff4e8] text-[#9a5a20]" },
        { title: "Точечная практика", copy: "Навыки, требующие дополнительной отработки.", meta: "Продолжить с пробелов", href: "/practice", icon: Target, tone: "bg-[#f1efff] text-[#5b4db7]" },
      ],
    },
    en: {
      eyebrow: "Explore the platform",
      title: "Start where your curiosity is.",
      copy: "Each path is organized around the kind of progress you want to make next.",
      viewAll: "View all tests",
      paths: [
        { title: "Mathematics", copy: "Algebra, calculus and problem solving.", meta: "Build fundamentals", href: "/subjects/mathematics", icon: BookOpen, tone: "bg-brand-soft text-brand" },
        { title: "Physics", copy: "Mechanics and the thinking behind each formula.", meta: "Reason with confidence", href: "/tests/physics-mechanics-beginner", icon: Atom, tone: "bg-[#eef4ff] text-[#315f9f]" },
        { title: "Programming", copy: "Arrays, complexity and practical logic.", meta: "Sharpen your logic", href: "/tests/programming-arrays-intermediate", icon: Code2, tone: "bg-[#fff4e8] text-[#9a5a20]" },
        { title: "Targeted practice", copy: "Return to the skills that need more reps.", meta: "Pick up where you left off", href: "/practice", icon: Target, tone: "bg-[#f1efff] text-[#5b4db7]" },
      ],
    },
  }[locale];

  return (
    <section id="subjects" className="border-y border-line bg-surface-soft">
      <Container className="!max-w-[1180px] py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={data.eyebrow}
            title={data.title}
            copy={data.copy}
          />
          <Link href="/tests" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">
            {data.viewAll} <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.paths.map(({ title, copy, meta, href, icon: Icon, tone }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-[220px] flex-col justify-between rounded-2xl border border-black/8 bg-white p-5 shadow-sm transition hover:border-black/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={"grid size-10 place-items-center rounded-xl " + tone}>
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight className="size-4 text-black/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{meta}</p>
                <h3 className="mt-1 text-base font-semibold text-ink group-hover:text-brand transition-colors">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-black/55">{copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
