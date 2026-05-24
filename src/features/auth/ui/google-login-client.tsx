"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { useState } from "react";

import { questApi, type ApiGoogleAuth } from "@/shared/api/questlab-api";
import { saveAuthenticatedIdentity } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";
import { Eyebrow, PremiumPanel } from "@/shared/ui/premium-shell";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleLoginClient() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [authData, setAuthData] = useState<ApiGoogleAuth | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function finishLogin(data: ApiGoogleAuth) {
    const role = getRole(data.profile.active_role);
    saveAuthenticatedIdentity(data.profile.identity_code);
    window.localStorage.setItem("questlab-auth-email", data.email);
    window.localStorage.setItem("questlab-is-admin", data.profile.available_roles.includes("admin") ? "1" : "0");
    window.localStorage.setItem("questlab-role", data.profile.active_role);
    window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: data.profile.active_role }));
    router.push(role.home);
  }

  async function handleCredential(value: string) {
    setBusy(true);
    setNotice("");
    try {
      const data = await questApi.googleAuth({ credential: value });
      setCredential(value);
      setAuthData(data);
      setSelectedRole(data.profile.active_role);
      if (!data.is_new) finishLogin(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseRole() {
    if (!credential) return;
    setBusy(true);
    setNotice("");
    try {
      const data = await questApi.googleAuth({ credential, active_role: selectedRole });
      finishLogin(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Role save failed.");
    } finally {
      setBusy(false);
    }
  }

  function initGoogle() {
    if (!googleClientId) {
      setNotice("NEXT_PUBLIC_GOOGLE_CLIENT_ID sozlanmagan.");
      return;
    }
    const target = document.getElementById("google-signin-button");
    if (!window.google || !target) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) void handleCredential(response.credential);
      },
    });
    target.innerHTML = "";
    window.google.accounts.id.renderButton(target, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
      width: 320,
    });
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-ink sm:px-8">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initGoogle} />
      <div className="mx-auto max-w-3xl">
        <PremiumPanel>
          <Eyebrow>Google auth</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">QuestLabga kiring</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/58">
            Google account bilan kiring. Birinchi kirishda rol tanlanadi, keyingi safar avtomatik o&apos;sha workspace ochiladi.
          </p>

          {!authData?.is_new ? (
            <div className="mt-8">
              <div id="google-signin-button" className="min-h-11" />
            </div>
          ) : (
            <section className="mt-8 rounded-3xl border border-black/8 bg-white p-5">
              <div className="flex items-center gap-3">
                {authData.picture ? <Image src={authData.picture} alt="" width={48} height={48} className="rounded-2xl" unoptimized /> : null}
                <div>
                  <p className="font-semibold">{authData.name || authData.email}</p>
                  <p className="text-sm text-black/45">{authData.email}</p>
                </div>
              </div>
              <h2 className="mt-6 text-2xl font-semibold">Rolni tanlang</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {roles.filter((role) => role.id !== "admin").map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`rounded-2xl border p-4 text-left ${active ? "border-ink bg-ink text-white" : "border-black/8 bg-surface-soft text-ink"}`}
                    >
                      <Icon className="size-5" />
                      <p className="mt-3 font-semibold">{role.label}</p>
                      <p className={`mt-1 text-sm leading-5 ${active ? "text-white/62" : "text-black/50"}`}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
              <button onClick={chooseRole} disabled={busy} className="mt-5 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Saving..." : "Continue"}
              </button>
            </section>
          )}

          {notice ? <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{notice}</p> : null}
        </PremiumPanel>
      </div>
    </main>
  );
}
