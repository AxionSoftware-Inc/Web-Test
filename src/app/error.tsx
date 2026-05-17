"use client";

import { useEffect } from "react";
import { BackendError } from "@/shared/ui/backend-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <BackendError title={error.message.includes("fetch") || error.message.includes("Backend") ? "Backend server ishlamayapti" : "Sahifani yuklashda xatolik bo‘ldi"} />
      <div className="-mt-20 flex justify-center">
        <button onClick={reset} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">
          Retry
        </button>
      </div>
    </div>
  );
}
