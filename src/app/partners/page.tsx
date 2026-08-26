import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";
import { getPublicImpactData } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const data = await getPublicImpactData();
  return (
    <>
      <PublicHeader />
      <main id="main" className="orbit-container py-12">
        <h1 className="text-5xl font-bold text-[var(--orbit-primary)]">Partners</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">ORBIT separates partner interest, validation, pilot status, and active operations. No TPS3R is presented as biodigester-ready without direct verification.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data.contributions.map((org) => (
            <Card key={org.id}>
              <Badge tone={org.status === "Pilot Partner" ? "green" : "blue"}>{org.status}</Badge>
              <h2 className="mt-3 text-xl font-bold">{org.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{org.type}. Public-safe accepted contribution: {org.accepted.toFixed(1)} kg.</p>
            </Card>
          ))}
        </div>
        <Card className="mt-8">
          <h2 className="text-lg font-bold">Partnership requirements</h2>
          <p className="mt-2 leading-7 text-slate-600">Partners need source sorting, inspection access, adult-managed safety procedures, measurement discipline, and permission to publish aggregated public-safe data.</p>
          <LinkButton href="/methodology" className="mt-5">Learn About Partnership</LinkButton>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
