"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getTeacherManageCode } from "@/shared/model/local-identity";

export function AssignTestClient({ classSlug, tests }: { classSlug: string; tests: ApiTest[] }) {
  const router = useRouter();
  const [testId, setTestId] = useState(String(tests[0]?.id ?? ""));
  const [title, setTitle] = useState(tests[0]?.title ?? "");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await questApi.createClassAssignment(classSlug, { test: Number(testId), title, is_active: isActive, manage_code: getTeacherManageCode(classSlug) });
      router.push(`/teacher/classes/${classSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <QuestPage variant="reading">
      <Card className="p-5">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-muted">
            Backend test
            <Select
              value={testId}
              onValueChange={(value) => {
                setTestId(value);
                setTitle(tests.find((test) => String(test.id) === value)?.title ?? title);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
              <SelectContent>
                {tests.map((test) => <SelectItem key={test.id} value={String(test.id)}>{test.title} / {test.difficulty}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-muted">
            Assignment title
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active assignment
          </label>
          <Button onClick={save} disabled={saving || !testId}>{saving ? "Saving..." : "Assign test"}</Button>
          {error ? <p className="rounded-[var(--radius-card)] bg-danger-soft p-3 text-sm font-semibold text-danger">{error}</p> : null}
        </div>
      </Card>
    </QuestPage>
  );
}
