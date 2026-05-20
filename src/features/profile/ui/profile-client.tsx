"use client";

import { useEffect, useState } from "react";

import type { ApiProfileSummary, ApiRoleProfile } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { ProfilePage } from "./profile-page";

export function ProfileClient({ initialSummary }: { initialSummary: ApiProfileSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [profile, setProfile] = useState<ApiRoleProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const identityCode = getStudentCode();
    Promise.all([
      questApi.profileSummary(identityCode),
      questApi.roleProfile(identityCode),
    ]).then(([nextSummary, nextProfile]) => {
      if (cancelled) return;
      setSummary(nextSummary);
      setProfile(nextProfile);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return <ProfilePage summary={summary} profile={profile} onProfileChange={setProfile} />;
}
