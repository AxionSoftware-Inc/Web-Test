import { AnalyticsSection } from "@/features/landing/ui/analytics-section";
import { FinalCtaSection } from "@/features/landing/ui/final-cta-section";
import { HeroSection } from "@/features/landing/ui/hero-section";
import { HowItWorksSection } from "@/features/landing/ui/how-it-works-section";
import { PositioningSection } from "@/features/landing/ui/positioning-section";
import { SubjectMapSection } from "@/features/landing/ui/subject-map-section";
import { TrustStrip } from "@/features/landing/ui/trust-strip";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-ink">
      <HeroSection />
      <TrustStrip />
      <HowItWorksSection />
      <SubjectMapSection />
      <PositioningSection />
      <AnalyticsSection />
      <FinalCtaSection />
    </main>
  );
}
