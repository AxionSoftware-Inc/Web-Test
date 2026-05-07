import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/shared/ui/container";

export function TestShell({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="border-b border-black/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-sm font-semibold text-[#276a5b]">
              QuestLab
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-black/55">
              <Link href="/tests">Tests</Link>
              <Link href="/subjects">Subjects</Link>
              <Link href="/practice">Practice</Link>
              <Link href="/results">Results</Link>
            </nav>
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
            {eyebrow}
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>
        {children}
      </Container>
    </main>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white">
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-md border border-black/10 px-4 py-2 text-sm font-semibold">
      {children}
    </Link>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
