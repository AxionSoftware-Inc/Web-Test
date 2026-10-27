import { CoreModuleGuard } from "@/core";

export default function ExamPacksLayout({ children }: { children: React.ReactNode }) {
  return (
    <CoreModuleGuard
      id="exam-packs"
      title="Exam Packs moduli o'chirilgan"
      description="Imtihon to'plamlari va test bazalari moduli hozirda faolsiz holatda."
    >
      {children}
    </CoreModuleGuard>
  );
}
