"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";

const storageKey = "questlab-role";

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "student";
    const stored = window.localStorage.getItem(storageKey) as UserRole | null;
    return stored && roles.some((role) => role.id === stored) ? stored : "student";
  });
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeRole = getRole(roleId);
  const Icon = activeRole.icon;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onRoleChange(event: Event) {
      const nextRole = (event as CustomEvent<UserRole>).detail;
      if (roles.some((role) => role.id === nextRole)) setRoleId(nextRole);
    }
    window.addEventListener("questlab-role-change", onRoleChange);
    return () => window.removeEventListener("questlab-role-change", onRoleChange);
  }, []);

  async function selectRole(nextRole: UserRole) {
    setSaving(true);
    setRoleId(nextRole);
    window.localStorage.setItem(storageKey, nextRole);
    window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: nextRole }));
    try {
      const profile = await questApi.updateRoleProfile(getStudentCode(), { active_role: nextRole });
      setRoleId(profile.active_role);
      window.localStorage.setItem(storageKey, profile.active_role);
      window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: profile.active_role }));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3 py-2 text-sm font-semibold text-black/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] disabled:opacity-60"
        disabled={saving}
      >
        <Icon className="size-4 text-[#276a5b]" />
        <span className="hidden sm:inline">{activeRole.label}</span>
        <ChevronDown className="size-4 text-black/38" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-black/8 bg-white p-2 shadow-[0_24px_70px_rgba(21,23,19,0.14)]">
          {roles.map((role) => {
            const RoleIcon = role.icon;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => selectRole(role.id)}
                className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-[#fbfbf6]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf7f3] text-[#276a5b]">
                  <RoleIcon className="size-5" />
                </span>
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    {role.label}
                    {role.id === activeRole.id ? <span className="rounded-full bg-[#edf7f3] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#276a5b]">Active</span> : null}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-black/50">{role.description}</span>
                </span>
              </button>
            );
          })}
          <div className="mt-2 border-t border-black/8 p-2">
            <Link href={activeRole.home} className="block rounded-2xl bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white" onClick={() => setOpen(false)}>
              Open {activeRole.label} workspace
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
