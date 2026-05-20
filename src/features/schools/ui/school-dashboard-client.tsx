"use client";

import { BarChart3, Building2, GraduationCap, Link2, Palette, Plus, Search, ShieldCheck, Sparkles, Trash2, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ApiSchool, ApiSchoolAnalytics, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode, saveSchoolManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function SchoolDashboardClient({ initialSchools, classes }: { initialSchools: ApiSchool[]; classes: ApiTeacherClass[] }) {
  const [schools, setSchools] = useState(initialSchools);
  const [activeSlug, setActiveSlug] = useState(initialSchools[0]?.slug ?? "");
  const [analytics, setAnalytics] = useState<ApiSchoolAnalytics | null>(null);
  const firstSchool = initialSchools[0];
  const [name, setName] = useState(firstSchool?.name ?? "Dirac Learning Center");
  const [owner, setOwner] = useState(firstSchool?.owner_name ?? "School owner");
  const [description, setDescription] = useState(firstSchool?.description ?? "Teacherlar va classlar umumiy nazorati.");
  const [portalSubdomain, setPortalSubdomain] = useState(firstSchool?.portal_subdomain ?? "dirac-school");
  const [portalDomain, setPortalDomain] = useState(firstSchool?.portal_domain ?? "");
  const [logoUrl, setLogoUrl] = useState(firstSchool?.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(firstSchool?.primary_color ?? "#151713");
  const [accentColor, setAccentColor] = useState(firstSchool?.accent_color ?? "#8fd6bd");
  const [studentInviteCode, setStudentInviteCode] = useState(firstSchool?.student_invite_code ?? "STUDENT-DEMO");
  const [teacherName, setTeacherName] = useState("Math teacher");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [roleId, setRoleId] = useState(() => {
    if (typeof window === "undefined") return "school";
    return window.localStorage.getItem("questlab-role") ?? "school";
  });

  const activeSchool = schools.find((school) => school.slug === activeSlug);
  const visibleTeachers = (analytics?.teachers ?? []).filter((teacher) => `${teacher.teacher_name} ${teacher.email}`.toLowerCase().includes(query.toLowerCase()));
  const activeTeachers = analytics?.teachers.filter((teacher) => teacher.is_active).length ?? activeSchool?.teacher_count ?? 0;
  const assignmentCount = classes.reduce((total, item) => total + item.assignment_count, 0);
  const weakSkills = analytics?.weak_skills.slice(0, 4) ?? [];
  const portalUrl = analytics?.portal_url || activeSchool?.portal_domain || (activeSchool?.portal_subdomain ? `https://${activeSchool.portal_subdomain}.yourplatform.com` : "");

  useEffect(() => {
    if (!activeSlug) return;
    let cancelled = false;
    questApi.schoolAnalytics(activeSlug)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setAnalytics(null);
        setNotice(error instanceof Error ? error.message : "School analytics yuklanmadi.");
      });
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    function onRoleChange(event: Event) {
      setRoleId((event as CustomEvent<string>).detail);
    }
    window.addEventListener("questlab-role-change", onRoleChange);
    return () => window.removeEventListener("questlab-role-change", onRoleChange);
  }, []);

  function selectSchool(slug: string) {
    const school = schools.find((item) => item.slug === slug);
    setActiveSlug(slug);
    setAnalytics(null);
    if (!school) return;
    setName(school.name);
    setOwner(school.owner_name);
    setDescription(school.description);
    setPortalSubdomain(school.portal_subdomain || "");
    setPortalDomain(school.portal_domain || "");
    setLogoUrl(school.logo_url || "");
    setPrimaryColor(school.primary_color || "#151713");
    setAccentColor(school.accent_color || "#8fd6bd");
    setStudentInviteCode(school.student_invite_code || "");
    if (school.manage_code) saveSchoolManageCode(school.slug, school.manage_code);
  }

  async function loadAnalytics(slug = activeSlug) {
    if (!slug) return;
    try {
      const data = await questApi.schoolAnalytics(slug);
      setAnalytics(data);
    } catch (error) {
      setAnalytics(null);
      setNotice(error instanceof Error ? error.message : "School analytics yuklanmadi.");
    }
  }

  async function createSchool() {
    if (!name.trim()) {
      setNotice("School name kerak.");
      return;
    }
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
        portal_subdomain: slugify(portalSubdomain),
        portal_domain: portalDomain,
        logo_url: logoUrl,
        primary_color: primaryColor,
        accent_color: accentColor,
        student_invite_code: studentInviteCode,
      });
      saveSchoolManageCode(school.slug, school.manage_code);
      setSchools((items) => [school, ...items]);
      setActiveSlug(school.slug);
      setNotice("School workspace yaratildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "School create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveBranding() {
    if (!activeSlug || !activeSchool) return;
    setBusy(true);
    setNotice("");
    try {
      const updated = await questApi.updateSchool(activeSlug, {
        portal_subdomain: slugify(portalSubdomain || activeSchool?.portal_subdomain || ""),
        portal_domain: portalDomain,
        logo_url: logoUrl,
        primary_color: primaryColor,
        accent_color: accentColor,
        student_invite_code: studentInviteCode,
        manage_code: getSchoolManageCode(activeSlug),
      });
      setSchools((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setNotice("White-label portal sozlamalari saqlandi.");
      await loadAnalytics(activeSlug);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Branding save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addTeacher() {
    if (!activeSlug) return;
    if (!teacherName.trim()) {
      setNotice("Teacher name kerak.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await questApi.createSchoolTeacher(activeSlug, {
        name: teacherName,
        email: teacherEmail,
        teacher_code: `${slugify(teacherName)}-${Date.now().toString().slice(-4)}`,
        classes: selectedClasses,
        manage_code: getSchoolManageCode(activeSlug),
      });
      await loadAnalytics(activeSlug);
      setNotice("Teacher schoolga qo'shildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Teacher add failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivateTeacher(teacherId: number) {
    if (!activeSlug) return;
    setBusy(true);
    setNotice("");
    try {
      await questApi.deleteSchoolTeacher(activeSlug, teacherId, getSchoolManageCode(activeSlug));
      await loadAnalytics(activeSlug);
      setNotice("Teacher inactive qilindi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Teacher deactivate failed.");
    } finally {
      setBusy(false);
    }
  }

  const classOptions = useMemo(() => classes.map((item) => ({ id: item.id, label: `${item.name} / ${item.teacher_name}` })), [classes]);

  return (
    <main className="min-h-screen bg-[#f4f2ea] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[28px] border border-black/8 bg-[#151713] text-white shadow-[0_28px_90px_rgba(21,23,19,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            <div className="p-6 sm:p-8">
              <Eyebrow>School home</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                {activeSchool?.name ?? "School operations"} uchun real-time boshqaruv
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62">
                Teacherlar, classlar, student activity va white-label portal bitta amaliy workspace ichida.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <HeroStat label="Active teachers" value={activeTeachers} />
                <HeroStat label="Linked classes" value={analytics?.class_count ?? classes.length} />
                <HeroStat label="Attempts" value={analytics?.attempts ?? 0} />
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/8 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-3xl bg-white p-5 text-[#151713] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">Portal</p>
                    <p className="mt-2 text-lg font-semibold">{activeSchool?.name ?? "Select school"}</p>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl text-white" style={{ background: activeSchool?.primary_color || primaryColor }}>
                    <Building2 className="size-5" />
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-black/8 bg-[#f7f7ef] p-4">
                  <p className="text-xs font-semibold text-black/42">Student invite</p>
                  <p className="mt-1 text-2xl font-semibold">{activeSchool?.student_invite_code || studentInviteCode || "Not set"}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ActionLink href="/schools/classes" icon={GraduationCap} label="Classes" />
                  <ActionLink href="/schools/classes" icon={Plus} label="Create class" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={GraduationCap} label="Teachers" value={activeTeachers} tone="green" />
          <Metric icon={ShieldCheck} label="Classes" value={analytics?.class_count ?? 0} tone="blue" />
          <Metric icon={UsersRound} label="Students submitted" value={analytics?.students_submitted ?? 0} tone="purple" />
          <Metric icon={TrendingUp} label="Average score" value={`${analytics?.average_score ?? 0}%`} tone="gold" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Eyebrow>Live school cards</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold">Bugungi operatsion holat</h2>
              </div>
              <button onClick={() => void loadAnalytics()} disabled={!activeSlug || busy} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Refresh</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InsightCard title="Portal ready" value={portalUrl ? "Live" : "Setup needed"} detail={portalUrl || "Domain yoki subdomain kiriting"} icon={Sparkles} />
              <InsightCard title="Assignments" value={assignmentCount} detail="Public classlardan jami tasklar" icon={BarChart3} />
              <InsightCard title="Teacher coverage" value={`${activeTeachers}/${analytics?.teacher_count ?? activeSchool?.teacher_count ?? 0}`} detail="Active teacher monitoring" icon={UsersRound} />
            </div>
          </Panel>

          <Panel>
            <Eyebrow>Weak skills</Eyebrow>
            <h2 className="mt-2 text-2xl font-semibold">E&apos;tibor kerak</h2>
            <div className="mt-5 grid gap-3">
              {weakSkills.map((skill) => (
                <div key={skill.skill} className="rounded-2xl border border-black/8 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{skill.skill}</p>
                    <span className="text-sm font-semibold text-[#8a5b19]">{skill.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
                    <div className="h-full rounded-full bg-[#d99b3d]" style={{ width: `${Math.max(4, Math.min(100, skill.percent))}%` }} />
                  </div>
                </div>
              ))}
              {!weakSkills.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Analytics yuklanganda weak skill kartalari shu yerda chiqadi.</p> : null}
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="grid gap-6">
            <div>
              <select value={activeSlug} onChange={(event) => selectSchool(event.target.value)} className={premiumInputClass}>
                <option value="">School tanlang</option>
                {schools.map((school) => <option key={school.id} value={school.slug}>{school.name}</option>)}
              </select>
            </div>
            {roleId === "admin" ? (
              <Panel>
                <Eyebrow>Create school</Eyebrow>
                <div className="mt-4 grid gap-4">
                  <Input label="School name" value={name} onChange={setName} />
                  <Input label="Owner" value={owner} onChange={setOwner} />
                  <Input label="Portal subdomain" value={portalSubdomain} onChange={setPortalSubdomain} />
                  <Input label="Logo URL" value={logoUrl} onChange={setLogoUrl} />
                  <FieldShell label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={premiumInputClass} rows={3} /></FieldShell>
                  <button onClick={createSchool} disabled={busy} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Create school</button>
                </div>
              </Panel>
            ) : null}

            <Panel>
              <Eyebrow>Branded portal</Eyebrow>
              <div className="mt-4 grid gap-4">
                <Input label="Custom domain" value={portalDomain} onChange={setPortalDomain} />
                <Input label="Student invite code" value={studentInviteCode} onChange={setStudentInviteCode} />
                <FieldShell label="Colors">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-12 w-full rounded-2xl border border-black/10 bg-white p-2" />
                    <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-12 w-full rounded-2xl border border-black/10 bg-white p-2" />
                  </div>
                </FieldShell>
                <button onClick={saveBranding} disabled={busy || !activeSlug} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50">
                  <Palette className="size-4" />
                  Save branding
                </button>
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Add teacher</Eyebrow>
              <div className="mt-4 grid gap-4">
                <Input label="Teacher name" value={teacherName} onChange={setTeacherName} />
                <Input label="Email" value={teacherEmail} onChange={setTeacherEmail} />
                <FieldShell label="Attach existing classes">
                  <select multiple value={selectedClasses.map(String)} onChange={(event) => setSelectedClasses(Array.from(event.target.selectedOptions).map((option) => Number(option.value)))} className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                    {classOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                  {!classOptions.length ? <p className="mt-2 text-xs font-semibold text-black/45">Avval teacher class yarating, keyin school teacherga bog&apos;lanadi.</p> : null}
                </FieldShell>
                <button onClick={addTeacher} disabled={busy || !activeSlug} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Add teacher</button>
              </div>
            </Panel>
          </aside>

          <div className="grid gap-6">
            <Panel>
              <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
                <div>
                  <Eyebrow>White-label preview</Eyebrow>
                  <h2 className="mt-2 text-2xl font-semibold">{activeSchool?.name ?? "School portal"}</h2>
                  <p className="mt-2 text-sm text-black/55">
                    Portal: {analytics?.portal_url || activeSchool?.portal_domain || (activeSchool?.portal_subdomain ? `https://${activeSchool.portal_subdomain}.yourplatform.com` : "Not configured")}
                  </p>
                  <p className="mt-2 text-sm text-black/55">Student invite: {activeSchool?.student_invite_code || "Not set"}</p>
                </div>
                <div className="rounded-3xl p-5 text-white" style={{ background: activeSchool?.primary_color || primaryColor }}>
                  {activeSchool?.logo_url ? (
                    <div className="mb-4 size-12 rounded-2xl bg-white bg-cover bg-center" style={{ backgroundImage: `url(${activeSchool.logo_url})` }} />
                  ) : (
                    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/15"><Building2 className="size-6" /></div>
                  )}
                  <p className="text-xl font-semibold">{activeSchool?.name ?? "School"}</p>
                  <div className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: activeSchool?.accent_color || accentColor, color: "#151713" }}>
                    Branded student dashboard
                  </div>
                </div>
              </div>
              {analytics?.portal_url ? (
                <button onClick={() => navigator.clipboard.writeText(analytics.portal_url)} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
                  <Link2 className="size-4" />
                  Copy portal URL
                </button>
              ) : null}
            </Panel>

            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><Eyebrow>Teachers</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Teacher performance</h2></div>
                <div className="flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-4 py-3"><Search className="size-4 text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-transparent text-sm outline-none" placeholder="Teacher search" /></div>
              </div>
              <div className="mt-5 grid gap-3">
                {visibleTeachers.map((teacher) => (
                  <div key={teacher.teacher_id} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_110px_110px_110px_auto] md:items-center">
                    <Link href={`/schools/teachers/${teacher.teacher_id}`}><p className="font-semibold">{teacher.teacher_name}</p><p className="text-sm text-black/45">{teacher.email || "No email"}</p></Link>
                    <p className="text-sm text-black/58">{teacher.class_count} class</p>
                    <p className="text-sm text-black/58">{teacher.students_submitted} students</p>
                    <span className="w-fit rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{teacher.average_score}%</span>
                    <button onClick={() => void deactivateTeacher(teacher.teacher_id)} className="grid size-10 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                {!visibleTeachers.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Teacher analytics hali yo&apos;q.</p> : null}
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Classes</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold">Class monitoring</h2>
              <div className="mt-5 grid gap-3">
                {analytics?.classes.map((item) => (
                  <Link key={item.class_id} href={`/schools/classes/${item.class_slug}`} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6] md:grid-cols-[1fr_130px_130px_100px] md:items-center">
                    <div><p className="font-semibold">{item.class_name}</p><p className="text-sm text-black/45">{item.teacher_name}</p></div>
                    <p className="text-sm text-black/58">{item.sessions_total} sessions</p>
                    <p className="text-sm text-black/58">{item.students_submitted} students</p>
                    <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-center text-sm font-semibold text-[#276a5b]">{item.average_score}%</span>
                  </Link>
                ))}
                {analytics && !analytics.classes.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Bu schoolga hali class bog&apos;lanmagan.</p> : null}
              </div>
            </Panel>
          </div>
        </section>
        {notice ? <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">{children}</section>;
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
    </div>
  );
}

function ActionLink({ href, icon: Icon, label }: { href: string; icon: typeof Building2; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/8 bg-white px-3 py-3 text-sm font-semibold hover:bg-[#f4f2ea]">
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function InsightCard({ title, value, detail, icon: Icon }: { title: string; value: string | number; detail: string; icon: typeof Building2 }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-black/52">{title}</p>
        <Icon className="size-4 text-black/35" />
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-2 truncate text-xs font-semibold text-black/38">{detail}</p>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FieldShell label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} /></FieldShell>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Building2; label: string; value: string | number; tone: "green" | "blue" | "purple" | "gold" }) {
  const tones = {
    green: "bg-[#eaf6ef] text-[#276a5b]",
    blue: "bg-[#e9f0fb] text-[#315f9f]",
    purple: "bg-[#f1ecf8] text-[#694f91]",
    gold: "bg-[#fbf0dc] text-[#8a5b19]",
  };

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_14px_36px_rgba(21,23,19,0.05)]">
      <div className={`grid size-10 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="size-4" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-black/38">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
