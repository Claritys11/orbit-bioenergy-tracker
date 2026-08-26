import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--orbit-border)] bg-[var(--orbit-secondary)] text-white">
      <div className="orbit-container grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-lg font-bold">ORBIT</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Public evidence platform outside, operational workspace inside. Demonstration dataset awaiting field validation.
          </p>
          <p className="mt-4 text-xs text-slate-400">JA WE Challenge 2026 concept prototype. No official endorsement implied.</p>
        </div>
        <div>
          <p className="font-semibold">Public</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <Link href="/transparency">Live Impact</Link>
            <Link href="/impact">Impact</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/sources">Sources</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Operations</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <Link href="/partners">Partners</Link>
            <Link href="/login">Sign In</Link>
            <Link href="https://github.com/Claritys11/orbit-bioenergy-tracker">GitHub Repository</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
