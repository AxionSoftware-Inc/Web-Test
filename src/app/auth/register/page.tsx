import type { Metadata } from "next";

import { GoogleLoginClient } from "@/features/auth/ui/google-login-client";

export const metadata: Metadata = {
  title: "Register | QuestLab",
};

export default function Page() {
  return <GoogleLoginClient />;
}
