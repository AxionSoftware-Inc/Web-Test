"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { getRole, roles, type UserRole } from "@/shared/model/roles";
import { useTranslation } from "@/shared/i18n/i18n-context";

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
  const { t } = useTranslation();

  const getRoleLabel = (id: UserRole) => {
    if (id in t.roles) return t.roles[id as keyof typeof t.roles];
    return activeRole.label;
  };

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
    setOpen(false);
    try {
      const profile = await questApi.updateRoleProfile(getStudentCode(), { active_role: nextRole });
      if (profile?.active_role) {
        setRoleId(profile.active_role);
        window.localStorage.setItem(storageKey, profile.active_role);
        window.dispatchEvent(new CustomEvent("questlab-role-change", { detail: profile.active_role }));
      }
    } catch {
      // Backend offline bo'lsa ham mahalliy rol o'zgarishi saqlanadi
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-black/8 bg-white px-3 text-sm font-semibold text-ink shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-black/20 hover:opacity-90 disabled:opacity-60"
        disabled={saving}
      >
        <Icon className="size-4 shrink-0 text-brand" />
        <span className="hidden whitespace-nowrap sm:inline">{getRoleLabel(activeRole.id)}</span>
        <ChevronDown className="size-4 shrink-0 text-black/40" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-black/8 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          {roles.map((role) => {
            const RoleIcon = role.icon;
            const isCurrent = role.id === activeRole.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => selectRole(role.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                  isCurrent ? "bg-surface-soft font-semibold" : "hover:bg-surface-soft"
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <RoleIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="text-sm text-ink">{getRoleLabel(role.id)}</span>
                    {isCurrent ? <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">Faol</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
          <div className="mt-2 border-t border-black/8 pt-2">
            <Link href={activeRole.home} className="block rounded-xl bg-ink px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90" onClick={() => setOpen(false)}>
              {getRoleLabel(activeRole.id)} panelini ochish
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
