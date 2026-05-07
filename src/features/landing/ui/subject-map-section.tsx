import Link from "next/link";
import { BookOpen, Brain, Calculator, Code2 } from "lucide-react";

import { subjectTracks } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";
import { SectionHeading } from "@/shared/ui/section-heading";

export function SubjectMapSection() {
  const icons = {
    Programming: Code2,
    Mathematics: Calculator,
    Physics: Brain,
    Logic: BookOpen,
  };

  return (
    <section id="subjects" className="bg-white">
      <Container className="py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Start here"
            title="Bo‘limni tanlang."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {subjectTracks.map((track) => {
            const Icon = icons[track.title as keyof typeof icons] ?? BookOpen;

            return (
              <Link key={track.title} href={track.href ?? "/subjects"}>
                <GlassCard className="flex min-h-[190px] flex-col justify-between p-5">
                <div className="grid size-12 place-items-center rounded-xl bg-white text-[#276a5b]">
                  <Icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{track.title}</h3>
                  <span className="mt-4 inline-block rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">
                    Open
                  </span>
                </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
