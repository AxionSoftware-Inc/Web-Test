import Link from "next/link";

import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export default function Page() {
  const steps = ["Pack info", "Subject / branch / level", "Tests", "Questions", "Preview", "Publish"];
  return (
    <PremiumPage>
      <PremiumPanel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Creator</p>
        <h1 className="mt-3 text-4xl font-semibold">Add Pack</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">Pack yaratish oqimi: metadata, testlar, import, preview va publish.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-black/8 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">Step {index + 1}</p>
              <p className="mt-2 font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </PremiumPanel>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/exam-packs" className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf6]"><h2 className="text-lg font-semibold">Create pack</h2><p className="mt-2 text-sm text-black/58">Pack metadata, JSON/CSV import va test tanlash.</p></Link>
        <Link href="/crud" className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf6]"><h2 className="text-lg font-semibold">Add test manually</h2><p className="mt-2 text-sm text-black/58">Testni savollari bilan qo&apos;lda kiritish.</p></Link>
        <Link href="/crud/schema" className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf6]"><h2 className="text-lg font-semibold">Import schema</h2><p className="mt-2 text-sm text-black/58">JSON pack strukturasini ko&apos;rish.</p></Link>
      </section>
    </PremiumPage>
  );
}
