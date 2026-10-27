import Link from "next/link";

import { Container } from "@/shared/ui/container";

export function BackendError({ title = "Backend server ishlamayapti" }: { title?: string }) {
  return (
    <main className="quest-page">
      <Container className="py-10">
        <section className="mx-auto max-w-2xl quest-panel p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">Connection error</p>
          <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-black/58">
            Django API serveri (`http://127.0.0.1:8001` yoki NEXT_PUBLIC_API_BASE_URL) ishlayotganini tekshiring, keyin sahifani yangilang.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
            Home
          </Link>
        </section>
      </Container>
    </main>
  );
}
