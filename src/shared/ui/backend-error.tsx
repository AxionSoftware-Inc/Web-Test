import Link from "next/link";

export function BackendError({ title = "Backend server ishlamayapti" }: { title?: string }) {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <section className="mx-auto max-w-2xl rounded-[28px] border border-black/8 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">Connection error</p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-black/58">
          Django API `http://127.0.0.1:8000` da ishlayotganini tekshiring, keyin sahifani refresh qiling.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
          Home
        </Link>
      </section>
    </main>
  );
}
