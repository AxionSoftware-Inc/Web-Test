"use client";

import { useEffect } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auth va RBAC qatlami vaqtinchalik o'chirilgan - hamma sahifalar ochiq
    if (typeof window !== "undefined") {
      if (!window.localStorage.getItem("questlab-role")) {
        window.localStorage.setItem("questlab-role", "student");
      }
      window.localStorage.setItem("questlab-is-admin", "1");
    }
  }, []);

  return children;
}
