import { CoreModuleGuard } from "@/core";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="creator"
      title="Test Muallifi (Creator) moduli o'chirilgan"
      description="Mualliflik studiyasi, testlar va savollar bankini boshqarish moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
