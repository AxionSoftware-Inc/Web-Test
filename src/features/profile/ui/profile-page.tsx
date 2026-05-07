import { profileStats } from "@/features/profile/model/profile-content";
import { ProfileDashboardClient } from "@/features/profile/ui/profile-dashboard-client";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="grid gap-5 border-b border-black/10 pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
              Learner profile
            </p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight">{profileStats.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">
              Saytga kirgan ro&apos;yxatdan o&apos;tgan user uchun birinchi ko&apos;rinadigan sahifa:
              testlar, bilim darajasi, progress, zaif mavzular va tavsiyalar shu yerda jamlanadi.
            </p>
          </div>
          <GlassCard className="p-5">
            <p className="text-sm text-black/50">Current level</p>
            <h2 className="mt-2 text-2xl font-semibold">{profileStats.level}</h2>
            <div className="mt-5 h-3 rounded bg-black/10">
              <div className="h-3 rounded bg-[#276a5b]" style={{ width: `${profileStats.mathMastery}%` }} />
            </div>
            <p className="mt-2 text-sm text-black/55">{profileStats.mathMastery}% math mastery</p>
          </GlassCard>
        </header>

        <ProfileDashboardClient />
      </Container>
    </main>
  );
}
