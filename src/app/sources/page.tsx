import { ExternalLink } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card } from "@/components/ui";
import { sourceClaims } from "@/lib/sources";

export default function SourcesPage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <h1 className="text-5xl font-bold text-[var(--orbit-secondary)]">Sources and Claims</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">Every important public claim is mapped to a source. ORBIT does not attach a citation to claims the source does not support.</p>
        <div className="mt-8 grid gap-4">
          {sourceClaims.map((source) => (
            <Card key={source.href}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge tone="blue">{source.status}</Badge>
                  <h2 className="mt-3 text-xl font-bold">{source.claim}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{source.title} - {source.publisher}, {source.year}. Supports: {source.supports}</p>
                </div>
                <a href={source.href} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-[var(--orbit-primary)]">
                  Source <ExternalLink size={16} aria-hidden />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
