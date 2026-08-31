"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <div className="grid grid-cols-[1.1fr_1fr_120px_120px_120px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
              <span>Class</span><span>Teacher</span><span>Visibility</span><span>Students</span><span>Assignments</span>
            </div>
            {filtered.map((item) => (
              <Link key={item.id} href={`/teacher/classes/${item.slug}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1.1fr_1fr_120px_120px_120px] lg:items-center">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{item.description || item.slug}</p>
                </div>
                <p className="text-sm text-muted">{item.teacher_name}</p>
                <Badge variant={item.visibility === "private" ? "warning" : "info"}>{item.visibility}</Badge>
                <p className="text-sm text-muted">{item.student_count}</p>
                <p className="text-sm text-muted">{item.assignment_count}</p>
              </Link>
            ))}
            {!filtered.length ? <p className="p-5 text-sm text-muted">No classes found.</p> : null}
          </div>
        </Card>
      </div>
    </QuestPage>
  );
}
