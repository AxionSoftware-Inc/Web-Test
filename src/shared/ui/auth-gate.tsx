"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getAuthenticatedIdentity } from "@/shared/model/local-identity";
import { getRole } from "@/shared/model/roles";

const publicPaths = [
  "/",
  "/about",
  "/auth/login",
  "/auth/register",
  "/auth/onboarding",
  "/tests",
  "/subjects",
  "/practice",
  "/questions",
  "/exam-packs",
  "/classes",
];

function isPublicPath(pathname: string) {
  return publicPaths.includes(pathname) || publicPaths.some((path) => path !== "/" && pathname.startsWith(`${path}/`)) || pathname.startsWith("/class/") || pathname.startsWith("/test-session/");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const identityCode = getAuthenticatedIdentity();

    if (!identityCode) {
      if (!isPublicPath(pathname)) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    questApi.roleProfile(identityCode)
      .then((profile) => {
        if (cancelled) return;
        window.localStorage.setItem("questlab-role", profile.active_role);
        window.localStorage.setItem("questlab-is-admin", profile.available_roles.includes("admin") ? "1" : "0");
        window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: profile.active_role }));
        if (pathname === "/auth/login" || pathname === "/auth/register") {
          router.replace(getRole(profile.active_role).home);
        }
      })
      .catch(() => {
        if (cancelled) return;
        window.localStorage.removeItem("questlab-auth-identity");
        window.localStorage.removeItem("questlab-role");
        if (!isPublicPath(pathname)) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      })

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return children;
}
