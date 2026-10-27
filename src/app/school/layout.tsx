import { CoreModuleGuard } from "@/core";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="school"
      title="Maktab va Ta'lim Markazlari moduli o'chirilgan"
      description="Maktablar, sinflar va o'qituvchilar boshqaruvi moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
