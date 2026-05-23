"use client";

import { BarChart3, Building2, GraduationCap, Home, LayoutDashboard, PackageCheck, Plus, Settings, TriangleAlert, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { roles, type UserRole } from "@/shared/model/roles";
import { RoleSwitcher } from "@/shared/ui/role-switcher";

const roleNavItems: Record<UserRole, Array<{ label: string; href: string; icon: typeof Home }>> = {
  student: [
    { label: "Home", href: "/student/home", icon: Home },
    { label: "Tests", href: "/student/tests", icon: LayoutDashboard },
    { label: "Mistakes", href: "/student/mistakes", icon: TriangleAlert },
    { label: "Progress", href: "/student/progress", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: UserRound },
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

export function AppHeader() {
  const pathname = usePathname();
  const [roleId, setRoleId] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "student";
    const stored = window.localStorage.getItem("questlab-role") as UserRole | null;
    return stored && roles.some((role) => role.id === stored) ? stored : "student";
  });
  const [canSwitchRoles, setCanSwitchRoles] = useState(() => {
    return false;
  });
  const isAuthed = typeof window !== "undefined" && Boolean(window.localStorage.getItem("questlab-auth-identity"));

  useEffect(() => {
    let cancelled = false;
    questApi.roleProfile(getStudentCode())
      .then((profile) => {
        if (cancelled) return;
        setRoleId(profile.active_role);
        window.localStorage.setItem("questlab-role", profile.active_role);
        const isAdmin = profile.available_roles.includes("admin");
        setCanSwitchRoles(isAdmin);
        window.localStorage.setItem("questlab-is-admin", isAdmin ? "1" : "0");
      })
      .catch(() => undefined);
    function onRoleChange(event: Event) {
      const nextRole = (event as CustomEvent<UserRole>).detail;
      if (roles.some((role) => role.id === nextRole)) setRoleId(nextRole);
    }
    window.addEventListener("questlab-role-change", onRoleChange);
    return () => {
      cancelled = true;
      window.removeEventListener("questlab-role-change", onRoleChange);
    };
  }, []);

  const navItems = roleNavItems[roleId] ?? roleNavItems.student;
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPathname === "/";
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-[#fbfbf6]/96 supports-[backdrop-filter]:bg-[#fbfbf6]/88 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#151713] text-sm font-bold text-white shadow-sm">
            Q
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-base font-semibold">QuestLab</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">Math MVP</span>
          </span>
        </Link>

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
                  active && "bg-[#151713] text-white shadow-sm hover:bg-[#151713]",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {canSwitchRoles ? <RoleSwitcher /> : null}
          {isAuthed ? (
            <Link
              href="/profile"
              aria-label="Open profile"
              className={cn(
                "grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-black/65 shadow-[0_10px_30px_rgba(0,0,0,0.04)]",
                pathname.startsWith("/profile") && "bg-[#151713] text-white",
              )}
            >
              <UserRound className="size-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
