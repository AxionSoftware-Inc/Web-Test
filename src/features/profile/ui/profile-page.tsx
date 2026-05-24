import { Award, BookOpen, CheckCircle2, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiProfileSummary, ApiRoleProfile } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { roles, type UserRole } from "@/shared/model/roles";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

type Props = {
  summary: ApiProfileSummary;
  profile: ApiRoleProfile | null;
  onProfileChange: (profile: ApiRoleProfile) => void;
};

export function ProfilePage({ summary, profile, onProfileChange }: Props) {
  const maxWeekly = Math.max(1, ...summary.weekly_activity.map((item) => item.value));
  const topicProgress = summary.topic_progress.length
    ? summary.topic_progress
    : [{ topic: "Algebra", slug: "algebra", value: 0, attempts: 0 }];

  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-8">
        <header className="grid gap-5 border-b border-black/10 pb-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Learner profile</p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight">{summary.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">
              Real backend natijalari asosida testlar soni, bilim darajasi, mavzu progressi, recent attempts va keyingi
              tavsiyalar shu yerda hisoblanadi.
            </p>
          </div>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-black/50">Current level</p>
                <h2 className="mt-2 text-2xl font-semibold">{summary.level}</h2>
              </div>
              <RadialScore value={summary.math_mastery} />
            </div>
          </GlassCard>
        </header>

        <AccountSettings key={profile?.identity_code ?? "profile-loading"} profile={profile} onProfileChange={onProfileChange} />

        <section className="grid gap-4 py-8 md:grid-cols-4">
          <ProfileMetric icon={<BookOpen className="size-5" />} label="Tests taken" value={summary.tests_taken} />
          <ProfileMetric icon={<Target className="size-5" />} label="Average score" value={`${summary.average_score}%`} />
          <ProfileMetric icon={<CheckCircle2 className="size-5" />} label="Correct answers" value={summary.correct_answers} />
          <ProfileMetric icon={<Award className="size-5" />} label="Answered" value={summary.answered_questions} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="overflow-hidden p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Weekly activity</h2>
                <p className="mt-1 text-sm text-black/50">Submitted test questions by day.</p>
              </div>
              <TrendingUp className="size-5 text-brand" />
            </div>
            <div className="mt-6 flex h-64 items-end gap-3">
              {summary.weekly_activity.map((item) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-52 w-full items-end rounded-2xl border border-black/8 bg-white/62 p-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-ink via-brand to-accent shadow-[0_12px_30px_rgba(39,106,91,0.25)] transition-all"
                      style={{ height: `${Math.max(6, (item.value / maxWeekly) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-black/50">{item.day}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Topic mastery</h2>
            <p className="mt-1 text-sm text-black/50">Backend resultlardan mavzu kesimida hisoblandi.</p>
            <div className="mt-6 grid gap-4">
              {topicProgress.map((topic) => (
                <div key={topic.slug} className="rounded-2xl border border-black/8 bg-white/62 p-4">
                  <div className="flex justify-between gap-3 text-sm font-semibold">
                    <span>{topic.topic}</span>
                    <span>{topic.value}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ink to-accent"
                      style={{ width: `${topic.value}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-black/45">{topic.attempts} attempt</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.75fr]">
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Recent tests</h2>
            {summary.recent_tests.length ? (
              <div className="mt-4 grid gap-3">
                {summary.recent_tests.map((test) => (
                  <Link
                    key={test.id}
                    href={`/tests/${test.slug}`}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-black/8 bg-white/62 p-4 hover:bg-white sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">{test.title}</p>
                      <p className="mt-1 text-sm text-black/55">
                        {test.topic} / {test.difficulty} / {test.correct}/{test.total} correct
                      </p>
                    </div>
                    <span className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white">{test.score}%</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyProfileState />
            )}
          </GlassCard>

          <aside className="rounded-[28px] border border-black/10 bg-ink p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
            <h2 className="text-xl font-semibold">Recommended next</h2>
            <div className="mt-4 grid gap-3">
              {summary.recommendations.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-2xl bg-white/8 p-4 hover:bg-white/12">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{item.description}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/subjects/mathematics/topics/algebra"
              className="mt-5 block rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-ink"
            >
              Continue Algebra
            </Link>
          </aside>
        </section>
      </Container>
    </main>
  );
}

function RadialScore({ value }: { value: number }) {
  return (
    <div
      className="grid size-28 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--brand) ${value * 3.6}deg, rgba(0,0,0,0.08) 0deg)`,
      }}
    >
      <div className="grid size-20 place-items-center rounded-full bg-surface-soft shadow-inner">
        <span className="text-2xl font-semibold">{value}%</span>
      </div>
    </div>
  );
}

function ProfileMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <GlassCard className="p-4">
      <div className="text-brand">{icon}</div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
    </GlassCard>
  );
}

function AccountSettings({ profile, onProfileChange }: { profile: ApiRoleProfile | null; onProfileChange: (profile: ApiRoleProfile) => void }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [role, setRole] = useState<UserRole>((profile?.active_role as UserRole | undefined) ?? "student");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const canUseAdmin = profile?.available_roles.includes("admin") ?? false;

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setNotice("");
    try {
      const updated = await questApi.updateRoleProfile(profile.identity_code, {
        display_name: displayName,
        phone,
        active_role: role,
      });
      onProfileChange(updated);
      window.localStorage.setItem("questlab-role", updated.active_role);
      window.localStorage.setItem("questlab-is-admin", updated.available_roles.includes("admin") ? "1" : "0");
      window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: updated.active_role }));
      setNotice("Profile saqlandi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("questlab-auth-identity");
    window.localStorage.removeItem("questlab-auth-email");
    window.localStorage.removeItem("questlab-is-admin");
    window.localStorage.removeItem("questlab-role");
    window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: "student" }));
    router.push("/");
  }

  return (
    <section className="pt-6">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Account settings</h2>
            <p className="mt-1 text-sm text-black/50">Username, phone va aktiv rolni boshqaring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile ? <span className="rounded-2xl bg-white/62 px-4 py-3 text-xs font-semibold text-black/45">{profile.identity_code}</span> : null}
            <button onClick={logout} className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">Log out</button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_260px_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-black/60">
            Username
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none" placeholder="Ism yoki username" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/60">
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none" placeholder="+998..." />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/60">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none">
              {roles.filter((item) => canUseAdmin || item.id !== "admin").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <button onClick={saveProfile} disabled={saving || !profile} className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {notice ? <p className="mt-4 rounded-2xl bg-white/62 px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
        <div className="mt-4 grid gap-3 rounded-2xl bg-white/52 p-4 text-sm leading-6 text-black/56 md:grid-cols-3">
          <p><span className="font-semibold text-black/75">Student:</span> testlar, mistakes va shaxsiy progress.</p>
          <p><span className="font-semibold text-black/75">Teacher:</span> classlar, students va assignments.</p>
          <p><span className="font-semibold text-black/75">School:</span> teachers, classes va analytics.</p>
        </div>
      </GlassCard>
    </section>
  );
}

function EmptyProfileState() {
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-black/14 bg-white/52 p-7 text-center">
      <h3 className="text-2xl font-semibold">Profile hali bosh</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/58">
        Birinchi backend testni submit qiling. Natija, chartlar va tavsiyalar avtomatik yangilanadi.
      </p>
      <Link
        href="/subjects/mathematics/topics/algebra"
        className="mt-5 inline-block rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
      >
        Start Algebra
      </Link>
    </div>
  );
}
