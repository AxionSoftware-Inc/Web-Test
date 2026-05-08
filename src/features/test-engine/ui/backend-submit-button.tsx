"use client";

import { useRouter } from "next/navigation";

import { questApi } from "@/shared/api/questlab-api";

export function BackendSubmitButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  async function submit() {
    await questApi.submit(sessionId);
    router.push(`/test-session/${sessionId}/result`);
  }

  return (
    <button type="button" onClick={submit} className="rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white">
      Confirm submit
    </button>
  );
}
