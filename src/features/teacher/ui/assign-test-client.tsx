"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getTeacherManageCode } from "@/shared/model/local-identity";

export function AssignTestClient({ classSlug, tests }: { classSlug: string; tests: ApiTest[] }) {
  const router = useRouter();
  const [testId, setTestId] = useState(tests[0]?.id ?? 0);
  const [title, setTitle] = useState(tests[0]?.title ?? "");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await questApi.createClassAssignment(classSlug, { test: testId, title, is_active: isActive, manage_code: getTeacherManageCode(classSlug) });
      router.push(`/teacher/classes/${classSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Assign test</p>
      <h1 className="mt-2 text-3xl font-semibold">Classga test biriktirish</h1>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-black/65">
          Backend test
          <select
            value={testId}
            onChange={(event) => {
              const id = Number(event.target.value);
              setTestId(id);
              setTitle(tests.find((test) => test.id === id)?.title ?? title);
            }}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          >
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.title} / {test.difficulty}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-black/65">
          Assignment title
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active
        </label>
        <button onClick={save} disabled={saving || !testId} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Assign test"}
        </button>
        {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
