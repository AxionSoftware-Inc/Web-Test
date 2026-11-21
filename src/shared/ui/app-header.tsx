"use client";

import {
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
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";
import { useTranslation } from "@/shared/i18n/i18n-context";
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
  const { t } = useTranslation();

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

  // Auth va RBAC cheklovlari o'chirilgan
  const currentRole = roleId;
  const dynamicNavItems = getNavItems(currentRole);
  const isTestCreatorActive = isModuleEnabled("test-generator");

  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPathname === "/";
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
  }

  function getLocalizedNavLabel(item: { id: string; label: string }) {
    switch (item.id) {
      case "student-home":
      case "school-home":
      case "creator-home":
      case "teacher-home":
        return t.nav.home;
      case "student-diagnostics":
        return t.nav.diagnosis;
      case "student-progress":
        return t.nav.progress;
      case "student-tests":
      case "creator-tests":
        return t.nav.tests;
      case "student-mistakes":
        return t.nav.mistakes;
      default:
        return item.label;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-surface-soft/96 supports-[backdrop-filter]:bg-surface-soft/88 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="quest-header-container flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid size-10 place-items-center rounded-xl bg-ink text-sm font-bold text-white shadow-sm">
            Q
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-base font-semibold text-ink">QuestLab</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">Adaptive MVP</span>
          </span>
        </Link>

        {!isAuthRoute ? (
          <nav className="flex max-w-[55vw] items-center gap-1 overflow-x-auto rounded-2xl border border-black/8 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:max-w-none">
            {dynamicNavItems.map((item) => {
              const Icon = iconMap[item.iconName] || Home;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-black/60 hover:bg-[#f3f3ec] transition-colors",
                    active && "bg-ink text-white shadow-sm hover:bg-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden whitespace-nowrap md:inline">{getLocalizedNavLabel(item)}</span>
                </Link>
              );
            })}
            <Link
              href="/settings/modules"
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-black/60 hover:bg-[#f3f3ec] transition-colors",
                isActive("/settings/modules") && "bg-ink text-white shadow-sm hover:bg-ink",
              )}
            >
              <Sliders className="size-4 shrink-0" />
              <span className="hidden whitespace-nowrap md:inline">{t.nav.modules}</span>
            </Link>
            <Link
              href="/about"
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-black/60 hover:bg-[#f3f3ec] transition-colors",
                isActive("/about") && "bg-ink text-white shadow-sm hover:bg-ink",
              )}
            >
              <Info className="size-4 shrink-0" />
              <span className="hidden whitespace-nowrap md:inline">{t.nav.about}</span>
            </Link>
          </nav>
        ) : null}

        {!isAuthRoute ? (
          <div className="flex items-center gap-2 shrink-0">
            {isTestCreatorActive && (
              <Link
                href="/create-test"
                className="hidden xl:inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Plus className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.addTest}</span>
              </Link>
            )}
            <RoleSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/profile"
              aria-label={t.nav.profile}
              className={cn(
                "grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-ink shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-black/20",
                pathname.startsWith("/profile") && "bg-ink text-white",
              )}
            >
              <UserRound className="size-4.5" />
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
