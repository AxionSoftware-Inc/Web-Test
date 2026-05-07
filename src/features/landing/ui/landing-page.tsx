import { HeroSection } from "@/features/landing/ui/hero-section";
import { PositioningSection } from "@/features/landing/ui/positioning-section";
import { SubjectMapSection } from "@/features/landing/ui/subject-map-section";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <div className="bg-[#fcfcf7]">
        <HeroSection />
      </div>
      <SubjectMapSection />
      <PositioningSection />
    </main>
  );
}
