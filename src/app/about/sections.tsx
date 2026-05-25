"use client";

import { useEffect, useState } from "react";

const engineStructure = {
  module: "features/mastery-engine/model",
  mode: "rule_based_no_llm",
  inputs: {
    session_answers: "submitted answers with correctness",
    question_metadata_snapshot: "topic, skills, difficulty, prerequisites, mastery weight",
    runtime_question_time: "transient per-question seconds, not persisted to DB",
  },
  outputs: {
    topic_mastery: ["attempts", "correct", "wrong", "accuracy", "mastery", "confidence", "status"],
    skill_mastery: ["attempts", "accuracy", "mastery", "confidence", "status"],
    mistakes: ["topic grouped wrong answers", "priority", "time quality", "recommended action"],
    recommendations: ["practice", "review", "retest", "lesson", "maintenance"],
    class_diagnostics: ["class topic weakness", "affected students", "severity", "teacher action"],
  },
  rules: {
    confidence: {
      low: "1-5 attempts",
      medium: "6-14 attempts",
      high: "15+ attempts",
    },
    status: ["not_started", "learning", "weak", "needs_practice", "good", "mastered", "stale"],
    time_quality: ["too_fast", "normal", "slow", "very_slow"],
    mistake_type_default: "unknown",
  },
  privacy: {
    personal_exploration: "private by default",
    teacher_visibility: "class assigned sessions only unless explicitly shared",
  },
};

export function AboutAdminEngineBlock() {
  const [isAdmin, setIsAdmin] = useState(() => readIsAdmin());

  useEffect(() => {
    function onRoleChange() {
      setIsAdmin(readIsAdmin());
    }
    window.addEventListener("questlab-role-change", onRoleChange);
    return () => window.removeEventListener("questlab-role-change", onRoleChange);
  }, []);

  if (!isAdmin) return null;

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Mastery Engine structure</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Admin-only structure for the diagnostic engine. The engine is deterministic and does not use LLM calls.
          </p>
        </div>
        <span className="rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">Admin only</span>
      </div>
      <pre className="mt-5 overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-6 text-white">
        <code>{JSON.stringify(engineStructure, null, 2)}</code>
      </pre>
    </section>
  );
}

function readIsAdmin() {
  if (typeof window === "undefined") return false;
  const role = window.localStorage.getItem("questlab-role");
  const adminFlag = window.localStorage.getItem("questlab-is-admin");
  return role === "admin" || adminFlag === "1";
}
