import Link from "next/link";

import { Container } from "@/shared/ui/container";

export function CtaSection() {
  return (
    <section id="start">
      <Container className="pb-16 pt-2">
        <div className="grid gap-6 rounded-lg border border-black/10 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
              Next build step
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Endi real route va layoutlarni quramiz.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">
              Landing tayyor bo&apos;lgach, keyingi bosqich: dashboard, subjects,
              problems va practice sahifalarining modular skeletonini qo&apos;yish.
            </p>
          </div>
          <Link
            href="/test-generator"
            className="w-fit rounded-md bg-[#276a5b] px-5 py-3 text-sm font-semibold text-white"
          >
            Open test generator
          </Link>
        </div>
      </Container>
    </section>
  );
}
