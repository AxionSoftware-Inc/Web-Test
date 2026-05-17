"use client";

import { useEffect, useState } from "react";

import type { ApiProfileSummary } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { ProfilePage } from "./profile-page";

export function ProfileClient({ initialSummary }: { initialSummary: ApiProfileSummary }) {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    let cancelled = false;
    questApi.profileSummary(getStudentCode()).then((next) => {
      if (!cancelled) setSummary(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return <ProfilePage summary={summary} />;
}
