import Link from "next/link";
import { BookOpenCheck, GraduationCap, PackageCheck, TriangleAlert } from "lucide-react";

import { Container } from "@/shared/ui/container";

export function HeroSection() {
  return (
    <section className="border-b border-black/10 bg-[#fcfcf7]">
      <Container className="grid gap-8 pb-10 pt-8 lg:grid-cols-[1fr_400px] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
            Skill-based math testing
          </p>
          <h1 className="text-4xl font-semibold leading-[1.04] sm:text-6xl">
            Algebra test qiling. Xatoni toping. Keyingi qadamni oling.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-black/62">
            QuestLab hozir Algebra uchun real backendli test, result, mistake bank, teacher class va exam pack oqimlarini bir joyga yigadi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/subjects/mathematics/topics/algebra" className="rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
              Open Algebra
            </Link>
            <Link href="/tests" className="rounded-xl bg-[#276a5b] px-5 py-3 text-sm font-semibold text-white">
              Start test
            </Link>
            <Link href="/profile" className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">
              View profile
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_18px_55px_rgba(21,23,19,0.08)]">
          <div className="grid grid-cols-2 gap-3">
            <HeroTile icon={<BookOpenCheck className="size-5" />} label="Tests" href="/tests" value="Backend" />
            <HeroTile icon={<TriangleAlert className="size-5" />} label="Mistakes" href="/mistakes" value="Diagnosis" />
            <HeroTile icon={<GraduationCap className="size-5" />} label="Classes" href="/teacher/classes" value="Tutor" />
            <HeroTile icon={<PackageCheck className="size-5" />} label="Packs" href="/exam-packs" value="Exam" />
          </div>
          <div className="mt-5 rounded-2xl bg-[#151713] p-4 text-white">
            <p className="text-sm font-semibold text-white/64">Core loop</p>
            <p className="mt-2 text-lg font-semibold">Test - Result - Mistake analysis - Retake</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroTile({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-black/8 bg-[#fbfbf6] p-4 hover:bg-white">
      <span className="text-[#276a5b]">{icon}</span>
      <p className="mt-4 text-lg font-semibold">{label}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{value}</p>
    </Link>
  );
}
