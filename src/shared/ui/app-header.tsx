"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Building2,
  GraduationCap,
  Home,
  Info,
  LayoutDashboard,
  Package,
  PackageCheck,
  Plus,
  Settings,
  Sliders,
  Target,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/cn";
import { roles, type UserRole } from "@/shared/model/roles";
import { RoleSwitcher } from "@/shared/ui/role-switcher";
import { useCoreKernel } from "@/core";

const iconMap: Record<string, React.ElementType> = {
  Home,
  LayoutDashboard,
  TriangleAlert,
  BarChart3,
  GraduationCap,
  UsersRound,
  Plus,
  PackageCheck,
  Building2,
  UserRound,
  Settings,
  BookOpen,
  BookOpenCheck,
  Target,
  Package,
  Sliders,
};

function subscribeToAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("questlab-role-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("questlab-role-change", callback);
  };
}

function getAuthSnapshot() {
  return Boolean(window.localStorage.getItem("questlab-auth-identity"));
}

function getServerAuthSnapshot() {
  return false;
}

function getAdminSnapshot() {
  return window.localStorage.getItem("questlab-is-admin") === "1";
}

function getServerAdminSnapshot() {
  return false;
}

export function AppHeader() {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth/");
  const isAuthed = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot);
  const isAdmin = useSyncExternalStore(subscribeToAuth, getAdminSnapshot, getServerAdminSnapshot);

  const [roleId, setRoleId] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "student";
    const stored = window.localStorage.getItem("questlab-role") as UserRole | null;
    return stored && roles.some((role) => role.id === stored) ? stored : "student";
  });

  const { getNavItems, isModuleEnabled } = useCoreKernel();

  useEffect(() => {
    function onRoleChange(event: Event) {
      const nextRole = (event as CustomEvent<UserRole>).detail;
      if (roles.some((role) => role.id === nextRole)) setRoleId(nextRole);
    }

    window.addEventListener("questlab-role-change", onRoleChange);
    return () => window.removeEventListener("questlab-role-change", onRoleChange);
  }, []);

  // Yadroviy dinamik navigatsiya: faqat faol modullarning elementlari
  const currentRole = isAuthed ? roleId : "public";
  const dynamicNavItems = getNavItems(currentRole);
  const isTestCreatorActive = isModuleEnabled("test-generator");

  const canSwitchRoles = isAuthed && isAdmin;
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPathname === "/";
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
  }

  if (pathname === "/") {
    return (
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-[#fbfcf7]/90 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-ink text-sm font-bold text-white">Q</span>
            <span className="text-sm font-semibold tracking-tight text-ink sm:text-base">QuestLab</span>
          </Link>
          <nav aria-label="Landing navigation" className="hidden items-center gap-6 text-sm font-medium text-ink/55 md:flex">
            <a href="#how-it-works" className="hover:text-brand">How it works</a>
            <a href="#subjects" className="hover:text-brand">Subjects</a>
            <a href="#teams" className="hover:text-brand">For teams</a>
            <Link href="/settings/modules" className="inline-flex items-center gap-1.5 hover:text-brand">
              <Sliders className="size-3.5" />
              <span>Modullar</span>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isTestCreatorActive && (
              <Link
                href="/create-test"
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-black/5"
              >
                <Plus className="size-3.5 text-emerald-600" />
                <span>Test yaratish</span>
              </Link>
            )}
            {isAuthed ? (
              <Link href="/profile" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink/62 hover:bg-white hover:text-ink sm:inline-flex">Profile</Link>
            ) : (
              <Link href="/auth/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink/62 hover:bg-white hover:text-ink sm:inline-flex">Log in</Link>
            )}
            <Link href="/tests" className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ring">
              Start exploring <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-surface-soft/96 supports-[backdrop-filter]:bg-surface-soft/88 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="quest-header-container flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-ink text-sm font-bold text-white shadow-sm">
            Q
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-base font-semibold">QuestLab</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">Math MVP</span>
          </span>
        </Link>

        {!isAuthRoute ? (
          <nav className="flex max-w-[66vw] items-center gap-1 overflow-x-auto rounded-2xl border border-black/8 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:max-w-none">
            {dynamicNavItems.map((item) => {
              const Icon = iconMap[item.iconName] || Home;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black/58 hover:bg-[#f3f3ec]",
                    active && "bg-ink text-white shadow-sm hover:bg-ink",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/settings/modules"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black/58 hover:bg-[#f3f3ec]",
                isActive("/settings/modules") && "bg-ink text-white shadow-sm hover:bg-ink",
              )}
            >
              <Sliders className="size-4" />
              <span className="hidden md:inline">Modullar</span>
            </Link>
            <Link
              href="/about"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black/58 hover:bg-[#f3f3ec]",
                isActive("/about") && "bg-ink text-white shadow-sm hover:bg-ink",
              )}
            >
              <Info className="size-4" />
              <span className="hidden md:inline">Haqida</span>
            </Link>
          </nav>
        ) : null}

        {!isAuthRoute ? (
          <div className="flex items-center gap-2">
            {isTestCreatorActive && (
              <Link
                href="/create-test"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Plus className="size-3.5" />
                <span>Test qo&apos;shish</span>
              </Link>
            )}
            {canSwitchRoles ? <RoleSwitcher /> : null}
            {isAuthed ? (
              <Link
                href="/profile"
                aria-label="Open profile"
                className={cn(
                  "grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-black/65 shadow-[0_10px_30px_rgba(0,0,0,0.04)]",
                  pathname.startsWith("/profile") && "bg-ink text-white",
                )}
              >
                <UserRound className="size-5" />
              </Link>
            ) : (
              <Link href="/auth/login" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Login</Link>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
