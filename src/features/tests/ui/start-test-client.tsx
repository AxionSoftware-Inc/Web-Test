"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";

export function StartTestClient({ testSlug, sessionBase = "/test-session" }: { testSlug: string; sessionBase?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    questApi.startTest(testSlug, { student_code: getStudentCode(), student_name: "Student" })
      .then((session) => {
        if (!cancelled) router.replace(`${sessionBase}/${session.id}`);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Start failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [router, sessionBase, testSlug]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="rounded-[28px] border border-black/8 bg-white/82 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold text-black/50">{error || "Test session tayyorlanyapti..."}</p>
      </div>
    </main>
  );
}
