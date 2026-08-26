"use client";

import Link from "next/link";
import { Menu, Recycle, X } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "@/components/ui";

const links = [
  { href: "/#overview", label: "Overview" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/transparency", label: "Live Impact" },
  { href: "/transparency", label: "Transparency" },
  { href: "/partners", label: "Partners" },
  { href: "/about", label: "About ORBIT" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--orbit-border)] bg-white/95 backdrop-blur">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="orbit-container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 font-bold text-[var(--orbit-secondary)]">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--orbit-primary)] text-white">
            <Recycle size={22} aria-hidden />
          </span>
          <span>
            <span className="block leading-5">ORBIT</span>
            <span className="block text-xs font-medium text-[var(--orbit-muted)]">
              Organic Recycling & Bioenergy Impact Tracker
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50">
              {link.label}
            </Link>
          ))}
          <LinkButton href="/login" variant="secondary">Sign In</LinkButton>
        </nav>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="public-mobile-nav"
          aria-label="Toggle navigation"
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>
      {open ? (
        <nav id="public-mobile-nav" className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile public navigation">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link key={link.href + link.label} href={link.href} className="rounded-md px-3 py-3 text-sm font-semibold text-slate-800" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <LinkButton href="/login" variant="secondary">Sign In</LinkButton>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
