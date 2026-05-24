"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getTeacherManageCode, saveTeacherManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function TeacherClassesClient({ initialClasses }: { initialClasses: ApiTeacherClass[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [name, setName] = useState("Algebra Group A");
  const [teacherName, setTeacherName] = useState("Teacher");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [joinCode, setJoinCode] = useState("1234");
  const [description, setDescription] = useState("Algebra tests and progress tracking.");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createClass() {
    if (!name.trim() || !teacherName.trim()) {
      setError("Class name va teacher name kerak.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const classroom = await questApi.createClass({
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        teacher_name: teacherName,
        visibility,
        join_code: visibility === "private" ? joinCode : "",
        manage_code: getTeacherManageCode(),
        description,
      });
      saveTeacherManageCode(classroom.slug, classroom.manage_code);
      setClasses((items) => [classroom, ...items]);
      setNotice("Class yaratildi. Kartani bosib session yoki homework oching.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Class create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <PremiumPanel>
        <Eyebrow>Teacher MVP</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create class</h1>
        <div className="mt-6 grid gap-4">
          <Input label="Class name" value={name} onChange={setName} />
          <Input label="Teacher name" value={teacherName} onChange={setTeacherName} />
          <FieldShell label="Visibility">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className={premiumInputClass}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </FieldShell>
          {visibility === "private" ? <Input label="Join code" value={joinCode} onChange={setJoinCode} /> : null}
          <FieldShell label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={premiumInputClass} />
          </FieldShell>
          <button onClick={createClass} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            <Plus className="size-4" />
            {saving ? "Creating..." : "Create class"}
          </button>
          {notice ? <p className="rounded-2xl bg-brand-soft p-3 text-sm font-semibold text-brand">{notice}</p> : null}
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <h2 className="text-2xl font-semibold">Classes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {classes.map((item) => (
            <Link key={item.id} href={`/teacher/classes/${item.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-surface-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-black/52">{item.teacher_name}</p>
                </div>
                <span className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">{item.visibility}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-black/58">{item.description || "No description"}</p>
              <div className="mt-5 flex gap-2 text-xs font-semibold text-black/45">
                <span>{item.assignment_count} assignments</span>
                <span>{item.student_count} students</span>
              </div>
            </Link>
          ))}
          {!classes.length ? <p className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-sm text-black/56 md:col-span-2">Hali class yo&apos;q. Chap tomondan birinchi classni yarating.</p> : null}
        </div>
      </PremiumPanel>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldShell label={label}>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} />
    </FieldShell>
  );
}
