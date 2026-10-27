import { CoreModuleGuard } from "@/core";

export default function CreateTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="test-generator"
      title="Test Generator & Ochiq Studiya moduli o'chirilgan"
      description="Tezkor test yaratish studiyasi hozirda faolsiz holatda. Uni yoqish uchun modullar sozlamasiga o'ting."
    >
      {children}
    </CoreModuleGuard>
  );
}
