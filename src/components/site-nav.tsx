"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Info, SquaresFour } from "@phosphor-icons/react";
import { LogoMark } from "./logo-mark";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Organizations", Icon: SquaresFour, match: (p: string) => p === "/" || p.startsWith("/org") },
  { href: "/about/", label: "About", Icon: Info, match: (p: string) => p.startsWith("/about") },
];

export function SiteNav() {
  // usePathname() already excludes the basePath, so this works on GitHub Pages too.
  const path = usePathname() ?? "/";

  return (
    <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6" aria-label="Main">
      <Link href="/" className="group mr-2 flex items-center gap-2.5 sm:mr-6">
        <LogoMark className="h-[22px] w-auto shrink-0 transition-transform duration-300 group-hover:scale-105" />
        <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.04em]" translate="no">
          {/* Two-tone: navy "LFX" + bright blue "Orgs"; in dark mode near-white "LFX" + bright blue "Orgs" */}
          <span className="text-[#0B3A75] dark:text-[#F2F4F7]">LFX</span>
          <span className="ml-1.5 text-[#009AFF] transition-colors group-hover:text-[#0077d9] dark:text-[#33ADFF] dark:group-hover:text-[#7AC0FA]">
            Orgs
          </span>
        </span>
      </Link>

      <ul className="hidden items-center gap-1 sm:flex">
        {LINKS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon size={18} weight={active ? "bold" : "regular"} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/about/"
          className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink sm:hidden"
        >
          About
        </Link>
        <ThemeToggle />
        <a
          href="https://mentorship.linuxfoundation.org/programs"
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover active:scale-[0.98] sm:inline-flex"
        >
          Apply on LFX
          <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
