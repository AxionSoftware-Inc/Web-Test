import { domains } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";

export function HeroSection() {
  return (
    <section className="border-b border-black/10 bg-[#fcfcf7]">
      <Container className="grid gap-10 pb-14 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
            Global problem-solving platform
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Programming, physics and math practice in one learning graph.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/68">
            Brilliantning konseptual o&apos;qitishi, LeetCodening kuchli judge
            tizimi va yangi adaptive skill graph birlashadi. Platforma boshidan
            modular qilib quriladi: web, content, judge, analytics va AI tutor
            alohida o&apos;sadi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#modules"
              className="rounded-md bg-[#276a5b] px-5 py-3 text-sm font-semibold text-white"
            >
              Explore modules
            </a>
            <a
              href="#architecture"
              className="rounded-md border border-black/15 px-5 py-3 text-sm font-semibold"
            >
              View architecture
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {domains.map((domain) => (
              <div key={domain.name} className="rounded-md border border-black/10 bg-[#fbfbf8] p-4">
                <div className={`mb-8 h-2 w-16 rounded ${domain.tone}`} />
                <h2 className="text-xl font-semibold">{domain.name}</h2>
                <p className="mt-2 text-sm text-black/55">{domain.metric}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-[#151713] p-5 text-white">
            <p className="text-sm text-white/60">Today focus</p>
            <p className="mt-2 text-2xl font-semibold">
              Graph traversal + conservation of energy
            </p>
            <div className="mt-5 h-2 rounded bg-white/10">
              <div className="h-2 w-[68%] rounded bg-[#8fd6bd]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
