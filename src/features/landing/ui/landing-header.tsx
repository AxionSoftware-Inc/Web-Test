import Link from "next/link";

import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";

export function LandingHeader() {
  return (
    <Container className="py-6">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-[#151713] text-sm font-bold text-white">
            Q
          </span>
          <span className="text-base font-semibold">{siteConfig.name}</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-black/60 md:flex">
          {siteConfig.navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <a
          href="#roadmap"
          className="rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
        >
          Start build
        </a>
      </nav>
    </Container>
  );
}
