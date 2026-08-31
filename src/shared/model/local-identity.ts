"use client";

function fallbackId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getLocalIdentity(key: string, prefix: string) {
  if (typeof window === "undefined") return fallbackId(prefix);
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? `${prefix}_${crypto.randomUUID()}` : fallbackId(prefix);
  window.localStorage.setItem(key, next);
  return next;
}

export function getStudentCode() {
  if (typeof window !== "undefined") {
    const authIdentity = window.localStorage.getItem("questlab-auth-identity");
    if (authIdentity) return authIdentity;
  }
  return getLocalIdentity("questlab-student-code", "student");
}

export function saveAuthenticatedIdentity(identityCode: string) {
  if (typeof window !== "undefined" && identityCode) window.localStorage.setItem("questlab-auth-identity", identityCode);
}

export function getAuthenticatedIdentity() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("questlab-auth-identity") ?? "";
}

export function getCreatorCode() {
  return getLocalIdentity("questlab-creator-code", "creator");
}

export function getTeacherManageCode(slug?: string) {
  return getLocalIdentity(slug ? `questlab-teacher-manage:${slug}` : "questlab-teacher-manage", "teacher");
}

export function saveTeacherManageCode(slug: string, code: string) {
  if (typeof window !== "undefined" && code) window.localStorage.setItem(`questlab-teacher-manage:${slug}`, code);
}

export function getPackManageCode(slug?: string) {
  return getLocalIdentity(slug ? `questlab-pack-manage:${slug}` : "questlab-pack-manage", "pack");
}

export function savePackManageCode(slug: string, code: string) {
  if (typeof window !== "undefined" && code) window.localStorage.setItem(`questlab-pack-manage:${slug}`, code);
}

export function getPackAccessCode(slug: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`questlab-pack-access:${slug}`) ?? "";
}

export function savePackAccessCode(slug: string, code: string) {
  if (typeof window !== "undefined" && code) window.localStorage.setItem(`questlab-pack-access:${slug}`, code);
}

export function getSchoolManageCode(slug?: string) {
  return getLocalIdentity(slug ? `questlab-school-manage:${slug}` : "questlab-school-manage", "school");
}

export function saveSchoolManageCode(slug: string, code: string) {
  if (typeof window !== "undefined" && code) window.localStorage.setItem(`questlab-school-manage:${slug}`, code);
}
