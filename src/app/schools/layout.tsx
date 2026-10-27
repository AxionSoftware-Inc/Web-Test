import { CoreModuleGuard } from "@/core";

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="school"
      title="Maktablar ro'yxati moduli o'chirilgan"
      description="Maktablar boshqaruvi moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
