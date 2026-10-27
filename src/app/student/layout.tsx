import { CoreModuleGuard } from "@/core";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="student"
      title="Talaba Kabineti moduli o'chirilgan"
      description="Talabalar o'quv kabineti va progress monitoringi moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
