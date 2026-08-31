"use client";

import { ArrowRight, BarChart3, BookOpen, Building2, GraduationCap, Home, Info, LayoutDashboard, PackageCheck, Plus, Settings, Target, TriangleAlert, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/cn";
import { roles, type UserRole } from "@/shared/model/roles";
import { RoleSwitcher } from "@/shared/ui/role-switcher";

const roleNavItems: Record<UserRole, Array<{ label: string; href: string; icon: typeof Home }>> = {
  student: [
    { label: "Home", href: "/student/home", icon: Home },
    { label: "Tests", href: "/student/tests", icon: LayoutDashboard },
    { label: "Mistakes", href: "/student/mistakes", icon: TriangleAlert },
    { label: "Progress", href: "/student/progress", icon: BarChart3 },
  ],
  teacher: [
    { label: "Home", href: "/teacher/home", icon: Home },
    { label: "Classes", href: "/teacher/classes", icon: GraduationCap },
    { label: "Students", href: "/teacher/students", icon: UsersRound },
    { label: "Add Test", href: "/teacher/add-test", icon: Plus },
    { label: "Packs", href: "/teacher/packs", icon: PackageCheck },
    { label: "Results", href: "/teacher/results", icon: BarChart3 },
  ],
  school: [
    { label: "Home", href: "/school/home", icon: Home },
    { label: "Classes", href: "/school/classes", icon: GraduationCap },
    { label: "Teachers", href: "/school/teachers", icon: UsersRound },
    { label: "Students", href: "/school/students", icon: UserRound },
    { label: "Reports", href: "/school/reports", icon: BarChart3 },
    { label: "Settings", href: "/school/settings", icon: Settings },
  ],
  creator: [
    { label: "Home", href: "/creator/home", icon: Home },
    { label: "Add Pack", href: "/creator/add-pack", icon: Plus },
    { label: "Packs", href: "/creator/packs", icon: PackageCheck },
    { label: "Tests", href: "/creator/tests", icon: LayoutDashboard },
    { label: "Questions", href: "/creator/questions", icon: LayoutDashboard },
  ],
  admin: [
    { label: "Home", href: "/admin/home", icon: Home },
    { label: "Schools", href: "/admin/schools", icon: Building2 },
    { label: "Classes", href: "/admin/classes", icon: GraduationCap },
    { label: "Tests", href: "/admin/tests", icon: LayoutDashboard },
    { label: "Packs", href: "/admin/packs", icon: PackageCheck },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
};

const publicNavItems: Array<{ label: string; href: string; icon: typeof Home }> = [
  { label: "Tests", href: "/tests", icon: LayoutDashboard },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Practice", href: "/practice", icon: Target },
  { label: "Questions", href: "/questions", icon: BookOpen },
];

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

  useEffect(() => {
    function onRoleChange(event: Event) {
      const nextRole = (event as CustomEvent<UserRole>).detail;
      if (roles.some((role) => role.id === nextRole)) setRoleId(nextRole);
    }

    window.addEventListener("questlab-role-change", onRoleChange);
    return () => window.removeEventListener("questlab-role-change", onRoleChange);
  }, []);

  const navItems = isAuthed ? (roleNavItems[roleId] ?? roleNavItems.student) : publicNavItems;
  const canSwitchRoles = isAuthed && isAdmin;
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

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
          </nav>
          <div className="flex items-center gap-2">
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

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPathname === "/";
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
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
              href="/about"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black/58 hover:bg-[#f3f3ec]",
                isActive("/about") && "bg-ink text-white shadow-sm hover:bg-ink",
              )}
            >
              <Info className="size-4" />
              <span className="hidden md:inline">About</span>
            </Link>
          </nav>
        ) : null}

        {!isAuthRoute ? (
          <div className="flex items-center gap-2">
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
