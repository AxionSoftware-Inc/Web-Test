import type { Metadata } from "next";

import { LoginClient } from "@/features/auth/ui/login-client";

export const metadata: Metadata = {
  title: "Login | QuestLab",
};

export default function Page() {
  return <LoginClient mode="login" />;
}
