"use client";

import { BookOpen, Building2, FlaskConical, GraduationCap, Home, LayoutDashboard, PackageCheck, Plus, SearchCheck, TriangleAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Math", href: "/subjects/mathematics", icon: BookOpen },
  { label: "Algebra", href: "/subjects/mathematics/topics/algebra", icon: FlaskConical },
  { label: "Tests", href: "/tests", icon: LayoutDashboard },
  { label: "Diagnosis", href: "/diagnosis", icon: SearchCheck },
  { label: "Mistakes", href: "/mistakes", icon: TriangleAlert },
  { label: "Schools", href: "/schools", icon: Building2 },
  { label: "Teacher", href: "/teacher/classes", icon: GraduationCap },
  { label: "Packs", href: "/exam-packs", icon: PackageCheck },
  { label: "Add", href: "/crud", icon: Plus },
];

export function AppHeader() {
  const pathname = usePathname();

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

        <nav className="flex max-w-[68vw] items-center gap-1 overflow-x-auto rounded-2xl border border-black/8 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:max-w-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
      </div>
    </header>
  );
}
