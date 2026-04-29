import { ArchitectureSection } from "@/features/landing/ui/architecture-section";
import { CtaSection } from "@/features/landing/ui/cta-section";
import { ExperienceSection } from "@/features/landing/ui/experience-section";
import { HeroSection } from "@/features/landing/ui/hero-section";
import { LandingHeader } from "@/features/landing/ui/landing-header";
import { LearningLoopSection } from "@/features/landing/ui/learning-loop-section";
import { ModulesSection } from "@/features/landing/ui/modules-section";
import { RoadmapSection } from "@/features/landing/ui/roadmap-section";
import { SubjectMapSection } from "@/features/landing/ui/subject-map-section";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <div className="bg-[#fcfcf7]">
        <LandingHeader />
        <HeroSection />
      </div>
      <SubjectMapSection />
      <ModulesSection />
      <LearningLoopSection />
      <ExperienceSection />
      <ArchitectureSection />
      <RoadmapSection />
      <CtaSection />
    </main>
  );
}
