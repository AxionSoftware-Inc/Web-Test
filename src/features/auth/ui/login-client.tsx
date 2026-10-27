"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { KeyRound, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

import { questApi } from "@/shared/api/questlab-api";
import { getLocalIdentity, saveAuthenticatedIdentity } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";
import { Eyebrow, PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

type LoginMode = "login" | "register";
type AuthTab = "account" | "local";

export function LoginClient({ mode }: { mode: LoginMode }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [activeTab, setActiveTab] = useState<AuthTab>("account");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function finalizeAuthSuccess(token: string, identityCode: string, activeRole: UserRole, availableRoles: string[]) {
    if (token) {
      window.localStorage.setItem("questlab-auth-token", token);
    }
    saveAuthenticatedIdentity(identityCode);
    window.localStorage.setItem("questlab-is-admin", availableRoles.includes("admin") ? "1" : "0");
    window.localStorage.setItem("questlab-role", activeRole);
    window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: activeRole }));

    const nextPath = new URLSearchParams(window.location.search).get("next");
    const destination = nextPath?.startsWith("/") ? nextPath : getRole(activeRole).home;
    router.push(destination);
  }

  async function handleAccountAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setBusy(true);

    try {
      if (isRegister) {
        if (!username.trim() || !password.trim()) {
          setNotice("Foydalanuvchi nomi va parol to‘ldirilishi shart.");
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setNotice("Parol kamida 6 ta belgidan iborat bo‘lishi lozim.");
          setBusy(false);
          return;
        }

        const res = await questApi.authRegister({
          username: username.trim(),
          password: password.trim(),
          email: email.trim() || undefined,
          display_name: displayName.trim() || undefined,
          role: selectedRole,
        });

        finalizeAuthSuccess(
          res.token,
          res.profile.identity_code,
          res.profile.active_role,
          res.profile.available_roles,
        );
      } else {
        if (!username.trim() || !password.trim()) {
          setNotice("Foydalanuvchi nomi (yoki email) va parol kiritilishi shart.");
          setBusy(false);
          return;
        }

        const res = await questApi.authLogin({
          username: username.trim(),
          password: password.trim(),
        });

        finalizeAuthSuccess(
          res.token,
          res.profile.identity_code,
          res.profile.active_role,
          res.profile.available_roles,
        );
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Avtorizatsiyada xatolik yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

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

      finalizeAuthSuccess("", profile.identity_code, profile.active_role, profile.available_roles);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Mahalliy profilni ochib bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PremiumPage>
      <div className="mx-auto max-w-3xl">
        <PremiumPanel>
          <div className="flex items-center justify-between">
            <Eyebrow>{activeTab === "account" ? "Token Authentication" : "Local Access"}</Eyebrow>
            <div className="inline-flex rounded-xl bg-surface-soft p-1 border border-black/8">
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "account" ? "bg-white text-ink shadow-sm" : "text-black/55 hover:text-ink"}`}
              >
                <KeyRound className="size-3.5" />
                <span>Akkaunt & Token</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("local")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "local" ? "bg-white text-ink shadow-sm" : "text-black/55 hover:text-ink"}`}
              >
                <UserCheck className="size-3.5" />
                <span>Tezkor sinov (Guest)</span>
              </button>
            </div>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            {activeTab === "account"
              ? isRegister
                ? "QuestLabda xavfsiz akkaunt oching"
                : "QuestLab hisobingizga kiring"
              : isRegister
                ? "QuestLabda tezkor profil yarating"
                : "Tezkor sinov rejimida kiring"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/58">
            {activeTab === "account"
              ? "Tizim DRF Token Authentication bilan himoyalangan. API so‘rovlaringiz xavfsiz token orqali tasdiqlanadi."
              : "Parolsiz, brauzeringiz xotirasida ishlaydigan tezkor test rejimi."}
          </p>

          {activeTab === "account" ? (
            <form onSubmit={handleAccountAuth} className="mt-8 grid gap-5">
              {isRegister ? (
                <label className="grid gap-1.5 text-sm font-semibold text-black/65">
                  Ismingiz (To‘liq ism)
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink"
                    placeholder="Masalan: Sardor Rahimov"
                    autoComplete="name"
                  />
                </label>
              ) : null}

              <label className="grid gap-1.5 text-sm font-semibold text-black/65">
                {isRegister ? "Foydalanuvchi nomi (Username)" : "Username yoki Email"}
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink"
                  placeholder={isRegister ? "sardor_01" : "Foydalanuvchi nomi yoki email"}
                  autoComplete="username"
                  required
                />
              </label>

              {isRegister ? (
                <label className="grid gap-1.5 text-sm font-semibold text-black/65">
                  Elektron pochta (Email - ixtiyoriy)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink"
                    placeholder="sardor@example.com"
                    autoComplete="email"
                  />
                </label>
              ) : null}

              <label className="grid gap-1.5 text-sm font-semibold text-black/65">
                Parol
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink"
                  placeholder="Kamida 6 ta belgi"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                />
              </label>

              {isRegister ? (
                <fieldset className="mt-2">
                  <legend className="text-sm font-semibold text-black/65">Boshlang‘ich rolni tanlang</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {roles
                      .filter((role) => role.id !== "admin")
                      .map((role) => {
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
              ) : null}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-50"
                >
                  <ShieldCheck className="size-4" />
                  <span>{busy ? "Kutilmoqda..." : isRegister ? "Ro‘yxatdan o‘tish (Token olish)" : "Kirish"}</span>
                </button>

                <div className="text-sm text-black/60">
                  {isRegister ? (
                    <span>
                      Akkauntingiz bormi?{" "}
                      <Link href="/auth/login" className="font-semibold text-ink underline hover:text-brand">
                        Kirish
                      </Link>
                    </span>
                  ) : (
                    <span>
                      Akkauntingiz yo‘qmi?{" "}
                      <Link href="/auth/register" className="font-semibold text-ink underline hover:text-brand">
                        Ro‘yxatdan o‘tish
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={continueWithLocalProfile} className="mt-8 grid gap-6">
              <label className="grid gap-2 text-sm font-semibold text-black/65">
                Ism yoki taxallus
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
                  {roles
                    .filter((role) => role.id !== "admin")
                    .map((role) => {
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

              <button
                type="submit"
                disabled={busy}
                className="w-fit inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                <span>{busy ? "Saqlanmoqda..." : "Tezkor sinov bilan boshlash"}</span>
              </button>
            </form>
          )}

          {notice ? <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{notice}</p> : null}
        </PremiumPanel>
      </div>
    </PremiumPage>
  );
}
