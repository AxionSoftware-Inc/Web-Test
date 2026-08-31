"use client";

import { BarChart3, Building2, GraduationCap, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import type { ApiRoleProfile, ApiSchool, ApiSchoolAnalytics, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode, saveSchoolManageCode } from "@/shared/model/local-identity";
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
    <main className="quest-page">
      <Container>
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="grid gap-4">
            <Panel>
              <Eyebrow>Admin schools</Eyebrow>
              <h1 className="mt-2 text-2xl font-semibold">Schools</h1>
              <div className="mt-4 grid gap-2">
                {schools.map((school) => (
                  <button key={school.id} onClick={() => setActiveSlug(school.slug)} className={`rounded-2xl border p-4 text-left ${school.slug === activeSlug ? "border-ink bg-ink text-white" : "border-black/8 bg-white"}`}>
                    <p className="font-semibold">{school.name}</p>
                    <p className={`mt-1 text-sm ${school.slug === activeSlug ? "text-white/55" : "text-black/45"}`}>{school.teacher_count} teachers</p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Create school</Eyebrow>
              <div className="mt-4 grid gap-3">
                <Input label="School name" value={name} onChange={setName} />
                <Input label="Owner" value={owner} onChange={setOwner} />
                <FieldShell label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={premiumInputClass} rows={3} /></FieldShell>
                <button onClick={createSchool} disabled={busy} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Create school</button>
              </div>
            </Panel>
          </aside>

          <section className="grid gap-4">
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Eyebrow>Selected school</Eyebrow>
                  <h2 className="mt-2 text-4xl font-semibold">{activeSchool?.name ?? "School tanlang"}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">{activeSchool?.description || "School boshqaruvi, teacherlar, classlar va analytics."}</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Metric icon={UsersRound} label="Teachers" value={analytics?.teacher_count ?? 0} />
                  <Metric icon={GraduationCap} label="Classes" value={analytics?.class_count ?? 0} />
                  <Metric icon={UsersRound} label="Students" value={analytics?.students_submitted ?? 0} />
                  <Metric icon={BarChart3} label="Avg" value={`${analytics?.average_score ?? 0}%`} />
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <Panel>
                <Eyebrow>Add teacher</Eyebrow>
                <div className="mt-4 grid gap-3">
                  <FieldShell label="Registered teacher email">
                    <div className="relative">
                      <input value={teacherEmail} onChange={(event) => void searchTeachers(event.target.value)} className={premiumInputClass} placeholder="teacher@email.com" />
                      {teacherMatches.length ? (
                        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
                          {teacherMatches.map((profile) => (
                            <button key={profile.identity_code} onClick={() => pickTeacher(profile)} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-background">
                              <span className="font-semibold">{profile.display_name || profile.email}</span>
                              <span className="block text-black/45">{profile.email}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </FieldShell>
                  <Input label="Teacher name" value={teacherName} onChange={setTeacherName} />
                  <FieldShell label="Attach classes">
                    <select multiple value={selectedClasses.map(String)} onChange={(event) => setSelectedClasses(Array.from(event.target.selectedOptions).map((option) => Number(option.value)))} className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                      {classOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </FieldShell>
                  <button onClick={addTeacher} disabled={busy || !activeSlug} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Add teacher</button>
                </div>
              </Panel>

              <Panel>
                <Eyebrow>Weak skills</Eyebrow>
                <div className="mt-4">
                  {weakSkillRows.length ? <WeakTopicBars rows={weakSkillRows} /> : <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Hali weak skill analytics yo&apos;q.</p>}
                </div>
              </Panel>
            </div>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <div><Eyebrow>Classes</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Class list</h2></div>
                <Link href="/schools/classes" className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">Open classes</Link>
              </div>
              <div className="mt-5 grid gap-3">
                {schoolClasses.map((item) => (
                  <Link key={item.class_id} href={`/schools/classes/${item.class_slug}`} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 hover:bg-surface-soft md:grid-cols-[1fr_170px_120px_100px] md:items-center">
                    <div><p className="font-semibold">{item.class_name}</p><p className="text-sm text-black/45">Teacher: {item.teacher_name}</p></div>
                    <p className="text-sm text-black/58">{item.sessions_total} sessions</p>
                    <p className="text-sm text-black/58">{item.students_submitted} students</p>
                    <span className="rounded-xl bg-brand-soft px-3 py-2 text-center text-sm font-semibold text-brand">{item.average_score}%</span>
                  </Link>
                ))}
                {!schoolClasses.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Bu schoolga hali class bog&apos;lanmagan.</p> : null}
              </div>
            </Panel>
          </section>
        </div>
        {notice ? <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
      </Container>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="quest-panel p-5">{children}</section>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FieldShell label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} /></FieldShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return <div className="min-w-24 rounded-2xl border border-black/8 bg-white p-3"><Icon className="size-4 text-brand" /><p className="mt-2 text-xs font-semibold text-black/38">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
