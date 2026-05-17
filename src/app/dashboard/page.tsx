import type { Metadata } from "next";

import { RoleWorkspace } from "@/features/roles/ui/role-workspace";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Dashboard | QuestLab",
};

export default function Page() {
  return (
    <PremiumPage>
      <RoleWorkspace />
    </PremiumPage>
  );
}
