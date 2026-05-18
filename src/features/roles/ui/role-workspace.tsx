"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";

const linksByRole: Record<UserRole, Array<{ title: string; href: string; copy: string }>> = {
  student: [
    { title: "Start tests", href: "/tests", copy: "Published testlarni ishlash." },
    { title: "Mistake bank", href: "/mistakes", copy: "Xatolar va weak skilllarni ko‘rish." },
    { title: "Profile", href: "/profile", copy: "Progress va recent results." },
  ],
  teacher: [
    { title: "Teacher classes", href: "/teacher/classes", copy: "Class yaratish va test biriktirish." },
    { title: "Public classes", href: "/classes", copy: "Classlar hammaga ko‘rinadigan katalog." },
    { title: "Create test", href: "/crud", copy: "Savol va testlarni DBga qo‘shish." },
  ],
  school: [
    { title: "School dashboard", href: "/schools/dashboard", copy: "Learning center analytics." },
    { title: "Classes", href: "/classes", copy: "Teacher classlarni ko‘rish." },
    { title: "Exam packs", href: "/exam-packs", copy: "Packlar va natijalar." },
  ],
  creator: [
    { title: "Test CRUD", href: "/crud", copy: "Test yaratish, edit, draft/publish." },
    { title: "Question bank", href: "/questions", copy: "Savollarni ko‘rish." },
    { title: "Exam packs", href: "/exam-packs", copy: "Pack yaratish va test qo‘shish." },
  ],
  admin: [
    { title: "Admin overview", href: "/admin", copy: "Platforma modullari holati." },
    { title: "Teacher classes", href: "/teacher/classes", copy: "Classlar va natijalar." },
    { title: "Exam packs", href: "/exam-packs", copy: "Packlar va natijalar." },
  ],
};

export function RoleWorkspace() {
  const [roleId, setRoleId] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "student";
    const stored = window.localStorage.getItem("questlab-role") as UserRole | null;
    return stored && roles.some((role) => role.id === stored) ? stored : "student";
  });

  useEffect(() => {
    let cancelled = false;
    questApi.roleProfile(getStudentCode()).then((profile) => {
      if (!cancelled) setRoleId(profile.active_role);
    }).catch(() => undefined);
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

  const role = getRole(roleId);
  const Icon = role.icon;

  return (
    <section className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Current role</p>
          <h1 className="mt-3 flex items-center gap-3 text-4xl font-semibold">
            <Icon className="size-8 text-[#276a5b]" />
            {role.label} workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">{role.description}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {linksByRole[role.id].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-black/8 bg-[#fbfbf6] p-5 hover:bg-white">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/58">{item.copy}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
