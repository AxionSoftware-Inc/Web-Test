import type { Metadata } from "next";

import { LoginClient } from "@/features/auth/ui/login-client";

export const metadata: Metadata = {
  title: "Register | QuestLab",
};

export default function Page() {
  return <LoginClient mode="register" />;
}
