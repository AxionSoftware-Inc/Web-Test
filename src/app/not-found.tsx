import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Container } from "@/shared/ui/container";

export default function NotFound() {
  return (
    <main className="quest-page flex min-h-[70vh] items-center justify-center">
      <Container className="py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Compass className="size-8" />
          </div>
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            404 — Sahifa topilmadi
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Adashib qoldingizmi?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko‘chirilgan bo‘lishi mumkin.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
            >
              <Home className="size-4" />
              Bosh sahifa
            </Link>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-surface-soft px-4 py-2.5 text-sm font-semibold text-ink/80 hover:bg-black/5"
            >
              <ArrowLeft className="size-4" />
              Testlar ro‘yxati
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
