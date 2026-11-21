"use client";

import { BarChart3, Building2, GraduationCap, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import type { ApiRoleProfile, ApiSchool, ApiSchoolAnalytics, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode, saveSchoolManageCode } from "@/shared/model/local-identity";
import { ModuleGuard } from "@/shared/modules";
import { Container } from "@/shared/ui/container";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function SchoolDashboardClient({ initialSchools, classes }: { initialSchools: ApiSchool[]; classes: ApiTeacherClass[] }) {
  const [schools, setSchools] = useState(initialSchools);
  const [activeSlug, setActiveSlug] = useState(initialSchools[0]?.slug ?? "");
  const [analytics, setAnalytics] = useState<ApiSchoolAnalytics | null>(null);
  const [name, setName] = useState("New School");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherMatches, setTeacherMatches] = useState<ApiRoleProfile[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const activeSchool = schools.find((school) => school.slug === activeSlug);
  const weakSkills = analytics?.weak_skills.slice(0, 5) ?? [];
  const weakSkillRows = weakSkills.map((skill) => ({
    label: skill.skill,
    value: Math.max(4, skill.percent),
    meta: `${skill.total} questions`,
  }));
  const schoolClasses = analytics?.classes ?? [];
  const classOptions = useMemo(() => classes.map((item) => ({ id: item.id, label: `${item.name} / ${item.teacher_name}` })), [classes]);

  useEffect(() => {
    if (!activeSlug) return;
    let cancelled = false;
    questApi.schoolAnalytics(activeSlug).then((data) => {
      if (!cancelled) setAnalytics(data);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  async function refresh(slug = activeSlug) {
    if (!slug) return;
    const data = await questApi.schoolAnalytics(slug);
    setAnalytics(data);
  }

  async function createSchool() {
    if (!name.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      const manageCode = getSchoolManageCode();
      const school = await questApi.createSchool({
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        owner_name: owner,
        manage_code: manageCode,
        visibility: "private",
        description,
        portal_subdomain: slugify(name),
        portal_domain: "",
        logo_url: "",
        primary_color: "var(--ink)",
        accent_color: "var(--accent)",
        student_invite_code: `ST-${Date.now().toString().slice(-4)}`,
      });
      saveSchoolManageCode(school.slug, manageCode);
      setSchools((items) => [school, ...items]);
      setActiveSlug(school.slug);
      setNotice("School yaratildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "School create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function searchTeachers(value: string) {
    setTeacherEmail(value);
    if (value.length < 3) {
      setTeacherMatches([]);
      return;
    }
    const matches = await questApi.searchRoleProfiles(value, "teacher");
    setTeacherMatches(matches);
  }

  function pickTeacher(profile: ApiRoleProfile) {
    setTeacherEmail(profile.email);
    setTeacherName(profile.display_name || profile.email);
    setTeacherMatches([]);
  }

  async function addTeacher() {
    if (!activeSlug || !teacherEmail.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      await questApi.createSchoolTeacher(activeSlug, {
        name: teacherName || teacherEmail,
        email: teacherEmail,
        teacher_code: `${slugify(teacherName || teacherEmail)}-${Date.now().toString().slice(-4)}`,
        classes: selectedClasses,
        manage_code: getSchoolManageCode(activeSlug),
      });
      await refresh(activeSlug);
      setNotice("Teacher schoolga qo'shildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Teacher add failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleGuard id="schools">
      <main className="quest-page">
      <Container>
        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <aside className="grid gap-4">
            <Panel>
              <Eyebrow>O&apos;quv markazlar</Eyebrow>
              <h1 className="mt-1 text-xl font-bold text-ink">Markazlar</h1>
              <div className="mt-3.5 grid gap-2">
                {schools.map((school) => (
                  <button key={school.id} onClick={() => setActiveSlug(school.slug)} className={`rounded-xl border p-3 text-left transition ${school.slug === activeSlug ? "border-ink bg-ink text-white" : "border-black/8 bg-[#fafaf8] hover:border-black/20 text-ink"}`}>
                    <p className="font-semibold text-sm">{school.name}</p>
                    <p className={`mt-0.5 text-xs ${school.slug === activeSlug ? "text-white/60" : "text-black/45"}`}>{school.teacher_count} o&apos;qituvchi</p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Yangi markaz</Eyebrow>
              <div className="mt-3.5 grid gap-3">
                <Input label="Markaz nomi" value={name} onChange={setName} />
                <Input label="Mas'ul shaxs" value={owner} onChange={setOwner} />
                <FieldShell label="Tavsif"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={premiumInputClass} rows={2} /></FieldShell>
                <button onClick={createSchool} disabled={busy} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">Markaz yaratish</button>
              </div>
            </Panel>
          </aside>

          <section className="grid gap-4">
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Eyebrow>Tanlangan markaz</Eyebrow>
                  <h2 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{activeSchool?.name ?? "Markaz tanlang"}</h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-black/55">{activeSchool?.description || "Markaz boshqaruvi, o'qituvchilar, sinflar va tahlil."}</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Metric icon={UsersRound} label="O'qituvchilar" value={analytics?.teacher_count ?? 0} />
                  <Metric icon={GraduationCap} label="Sinflar" value={analytics?.class_count ?? 0} />
                  <Metric icon={UsersRound} label="O'quvchilar" value={analytics?.students_submitted ?? 0} />
                  <Metric icon={BarChart3} label="O'rtacha" value={`${analytics?.average_score ?? 0}%`} />
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <Panel>
                <Eyebrow>O&apos;qituvchi biriktirish</Eyebrow>
                <div className="mt-3.5 grid gap-3">
                  <FieldShell label="Ro'yxatdan o'tgan teacher emaili">
                    <div className="relative">
                      <input value={teacherEmail} onChange={(event) => void searchTeachers(event.target.value)} className={premiumInputClass} placeholder="teacher@email.com" />
                      {teacherMatches.length ? (
                        <div className="absolute z-20 mt-2 w-full rounded-xl border border-black/8 bg-white p-2 shadow-xl">
                          {teacherMatches.map((profile) => (
                            <button key={profile.identity_code} onClick={() => pickTeacher(profile)} className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#fafaf8]">
                              <span className="font-semibold text-ink">{profile.display_name || profile.email}</span>
                              <span className="block text-black/45">{profile.email}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </FieldShell>
                  <Input label="O'qituvchi ismi" value={teacherName} onChange={setTeacherName} />
                  <FieldShell label="Sinflarni bog'lash">
                    <select multiple value={selectedClasses.map(String)} onChange={(event) => setSelectedClasses(Array.from(event.target.selectedOptions).map((option) => Number(option.value)))} className="min-h-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none">
                      {classOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </FieldShell>
                  <button onClick={addTeacher} disabled={busy || !activeSlug} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"><Plus className="size-4" />O&apos;qituvchi qo&apos;shish</button>
                </div>
              </Panel>

              <Panel>
                <Eyebrow>Kuchsiz mavzular</Eyebrow>
                <div className="mt-3.5">
                  {weakSkillRows.length ? <WeakTopicBars rows={weakSkillRows} /> : <p className="rounded-xl border border-dashed border-black/10 bg-[#fafaf8] p-5 text-center text-xs text-black/50">Hali tahlil ma&apos;lumotlari yo&apos;q.</p>}
                </div>
              </Panel>
            </div>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <div><Eyebrow>Sinflar</Eyebrow><h2 className="mt-1 text-xl font-bold text-ink">Guruhlar ro&apos;yxati</h2></div>
                <Link href="/schools/classes" className="rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90">Sinflarni ochish</Link>
              </div>
              <div className="mt-4 grid gap-2.5">
                {schoolClasses.map((item) => (
                  <Link key={item.class_id} href={`/schools/classes/${item.class_slug}`} className="group grid gap-3 rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20 md:grid-cols-[1fr_160px_120px_90px] md:items-center">
                    <div><p className="font-semibold text-sm text-ink group-hover:text-brand transition-colors">{item.class_name}</p><p className="text-xs text-black/45">O&apos;qituvchi: {item.teacher_name}</p></div>
                    <p className="text-xs text-black/60">{item.sessions_total} sessiya</p>
                    <p className="text-xs text-black/60">{item.students_submitted} o&apos;quvchi</p>
                    <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-center text-xs font-bold text-brand">{item.average_score}%</span>
                  </Link>
                ))}
                {!schoolClasses.length ? <p className="rounded-xl border border-dashed border-black/10 bg-[#fafaf8] p-5 text-center text-xs text-black/50">Bu markazga hali sinflar bog&apos;lanmagan.</p> : null}
              </div>
            </Panel>
          </section>
        </div>
        {notice ? <p className="mt-4 rounded-xl border border-black/8 bg-white px-4 py-2.5 text-xs font-semibold text-black/60">{notice}</p> : null}
      </Container>
    </main>
    </ModuleGuard>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">{children}</section>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FieldShell label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} /></FieldShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-black/4 bg-[#fafaf8] p-2.5 text-center">
      <Icon className="mx-auto size-4 text-brand" />
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-0.5 text-base font-bold text-ink">{value}</p>
    </div>
  );
}
