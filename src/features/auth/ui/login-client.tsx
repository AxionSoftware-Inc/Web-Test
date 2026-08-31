"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getLocalIdentity, saveAuthenticatedIdentity } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";
import { Eyebrow, PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

type LoginMode = "login" | "register";

export function LoginClient({ mode }: { mode: LoginMode }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function continueWithLocalProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setNotice("Ismingizni kiriting.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const identityCode = getLocalIdentity("questlab-student-code", "student");
      await questApi.roleProfile(identityCode);
      const profile = await questApi.updateRoleProfile(identityCode, {
        display_name: name,
        active_role: selectedRole,
      });

      saveAuthenticatedIdentity(profile.identity_code);
      window.localStorage.removeItem("questlab-auth-email");
      window.localStorage.setItem("questlab-is-admin", profile.available_roles.includes("admin") ? "1" : "0");
      window.localStorage.setItem("questlab-role", profile.active_role);
      window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: profile.active_role }));

      const nextPath = new URLSearchParams(window.location.search).get("next");
      const destination = nextPath?.startsWith("/") ? nextPath : getRole(profile.active_role).home;
      router.push(destination);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Profilni ochib bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PremiumPage>
      <div className="mx-auto max-w-3xl">
        <PremiumPanel>
          <Eyebrow>Local access</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {isRegister ? "QuestLabda profil yarating" : "QuestLabga kiring"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/58">
            Tashqi akkaunt kerak emas. Ismingizni va ish workspace’ingizni tanlang — profil shu brauzerda local identity sifatida saqlanadi.
          </p>

          <form onSubmit={continueWithLocalProfile} className="mt-8 grid gap-6">
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Ism yoki username
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink"
                placeholder="Masalan, Ali Karimov"
                autoComplete="name"
                required
              />
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-black/65">Workspace rolini tanlang</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {roles.filter((role) => role.id !== "admin").map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`rounded-2xl border p-4 text-left transition ${active ? "border-ink bg-ink text-white" : "border-black/8 bg-surface-soft text-ink hover:border-black/20"}`}
                    >
                      <Icon className="size-5" />
                      <p className="mt-3 font-semibold">{role.label}</p>
                      <p className={`mt-1 text-sm leading-5 ${active ? "text-white/62" : "text-black/50"}`}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button type="submit" disabled={busy} className="w-fit rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "Saving..." : isRegister ? "Profil yaratish" : "Davom etish"}
            </button>
          </form>

          {notice ? <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{notice}</p> : null}
        </PremiumPanel>
      </div>
    </PremiumPage>
  );
}
