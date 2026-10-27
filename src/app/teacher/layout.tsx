import { CoreModuleGuard } from "@/core";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="teacher"
      title="O'qituvchi Kabineti moduli o'chirilgan"
      description="O'qituvchilar va guruhlar boshqaruvi moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
