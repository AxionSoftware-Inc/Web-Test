import Link from "next/link";

import { Container } from "@/shared/ui/container";

type HubLink = {
  title: string;
  href: string;
  copy: string;
};

export function RouteHubPage({
  eyebrow,
  title,
  copy,
  links,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  links: HubLink[];
}) {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-8">
        <header className="border-b border-black/10 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">{copy}</p>
        </header>
        <section className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-black/60">{item.copy}</p>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
