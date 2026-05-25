"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getTeacherManageCode, saveTeacherManageCode } from "@/shared/model/local-identity";

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
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    return classes.filter((item) => `${item.name} ${item.teacher_name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  }, [classes, query]);

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
      setNotice("Class created. Open the class to assign tests and review results.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Class create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <QuestPage variant="wide">
      <PageHeader eyebrow="Teacher" title="Classes" copy="Create classes, assign tests and monitor class progress." />
      <div className="quest-metric-grid">
        <Metric label="Classes" value={classes.length} />
        <Metric label="Students" value={classes.reduce((sum, item) => sum + item.student_count, 0)} />
        <Metric label="Assignments" value={classes.reduce((sum, item) => sum + item.assignment_count, 0)} />
        <Metric label="Private classes" value={classes.filter((item) => item.visibility === "private").length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">Create class</h2>
          <div className="mt-4 grid gap-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Class name" />
            <Input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} placeholder="Teacher name" />
            <Select value={visibility} onValueChange={(value) => setVisibility(value as "public" | "private")}>
              <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            {visibility === "private" ? <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Join code" /> : null}
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:quest-focus" />
            <Button onClick={createClass} disabled={saving}>
              <Plus className="size-4" />
              {saving ? "Creating..." : "Create class"}
            </Button>
            {notice ? <p className="rounded-[var(--radius-card)] bg-success-soft p-3 text-sm font-semibold text-success">{notice}</p> : null}
            {error ? <p className="rounded-[var(--radius-card)] bg-danger-soft p-3 text-sm font-semibold text-danger">{error}</p> : null}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Class workspaces</h2>
            <div className="flex min-w-[260px] items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2">
              <Search className="size-4 text-subtle" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search classes..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="mt-4 quest-card-grid-3">
            {filtered.map((item) => (
              <Link key={item.id} href={`/teacher/classes/${item.slug}`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted">{item.teacher_name}</p>
                  </div>
                  <Badge variant={item.visibility === "private" ? "warning" : "info"}>{item.visibility}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{item.description || "No description"}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
                  <span className="rounded-lg bg-surface-soft px-2 py-1">{item.assignment_count} assignments</span>
                  <span className="rounded-lg bg-surface-soft px-2 py-1">{item.student_count} students</span>
                </div>
              </Link>
            ))}
            {!filtered.length ? <p className="rounded-[var(--radius-card)] border border-dashed border-line p-5 text-sm text-muted">No classes found.</p> : null}
          </div>
        </Card>
      </div>
    </QuestPage>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="quest-stat-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
