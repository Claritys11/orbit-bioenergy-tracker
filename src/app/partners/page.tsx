import Link from "next/link";
import { ArrowRight, Building2, Flame, Recycle, Users, Zap } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";
import { NetworkHighlights } from "@/components/partners/network-highlights";
import { PartnerLeaderboard } from "@/components/partners/partner-leaderboard";
import { PartnerCard } from "@/components/partners/partner-card";
import { getPublicPartnerNetwork } from "@/lib/services/partner-service";

export const dynamic = "force-dynamic";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const { type: filterType, sort: sortOption } = await searchParams;
  const data = await getPublicPartnerNetwork(filterType);

  // Apply optional card sorting if requested
  const sortedPartners = [...data.partners].sort((a, b) => {
    if (sortOption === "consistency") {
      return b.metrics.streak.longestStreak - a.metrics.streak.longestStreak;
    }
    if (sortOption === "quality") {
      return b.metrics.acceptanceRate - a.metrics.acceptanceRate;
    }
    if (sortOption === "recent") {
      const aTime = a.metrics.streak.lastContributionDate?.getTime() ?? 0;
      const bTime = b.metrics.streak.lastContributionDate?.getTime() ?? 0;
      return bTime - aTime;
    }
    // Default: Overall Recognition score
    return b.metrics.orbitRecognitionScore - a.metrics.orbitRecognitionScore;
  });

  const filterTabs = [
    { label: "All Partners", value: "ALL" },
    { label: "Schools", value: "SCHOOL" },
    { label: "Community Operators", value: "OPERATOR" },
    { label: "Supporting Contributors", value: "SUPPORTING_CONTRIBUTOR" },
    { label: "Community Advocacy", value: "COMMUNITY_PARTNER" },
  ];

  return (
    <>
      <PublicHeader />
      <main id="main" className="bg-[var(--background)] py-12">
        <div className="orbit-container">
          {/* Hero Section */}
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">Verified Eco-Network</Badge>
              <Badge tone="amber">Simulated Demo Dataset</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--orbit-primary)] sm:text-5xl">
              ORBIT Partner Network
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Schools, community operators, and supporting contributors working together to turn traceable
              organic waste into measurable bioenergy impact.
            </p>
          </div>

          {/* Network-Level Stat Counters */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Active Partners</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{data.overview.totalPartners}</p>
              <p className="mt-1 text-xs text-slate-500">Participating organisations</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Schools</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{data.overview.totalSchools}</p>
              <p className="mt-1 text-xs text-slate-500">Source sorting hubs</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Recycle size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Operators</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{data.overview.totalOperators}</p>
              <p className="mt-1 text-xs text-slate-500">TPS3R conversion units</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Flame size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Verified Diverted</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                {data.overview.totalVerifiedOrganicsKg} <span className="text-sm font-semibold">kg</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Operator accepted mass</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Zap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Traceable Gas</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-blue-700">
                {data.overview.totalTraceableGasM3} <span className="text-sm font-semibold">m³</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Anaerobic biogas yield</p>
            </div>
          </div>

          {/* Network Highlights */}
          <NetworkHighlights highlights={data.highlights} />

          {/* Categorical Leaderboard */}
          <PartnerLeaderboard initialLeaderboard={data.leaderboard} />

          {/* Directory Section Header & Filter Tabs */}
          <div className="mt-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Explore All Partners</h2>
              <p className="mt-1 text-sm text-slate-600">
                Click any partner to inspect their public contribution profile, weekly activity heatmap, and verified achievements.
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Sort by:</span>
              <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold">
                <Link
                  href={`/partners?type=${filterType || "ALL"}&sort=overall`}
                  className={`rounded-md px-2.5 py-1 ${
                    !sortOption || sortOption === "overall" ? "bg-[var(--orbit-primary)] text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Score
                </Link>
                <Link
                  href={`/partners?type=${filterType || "ALL"}&sort=consistency`}
                  className={`rounded-md px-2.5 py-1 ${
                    sortOption === "consistency" ? "bg-[var(--orbit-primary)] text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Streak
                </Link>
                <Link
                  href={`/partners?type=${filterType || "ALL"}&sort=quality`}
                  className={`rounded-md px-2.5 py-1 ${
                    sortOption === "quality" ? "bg-[var(--orbit-primary)] text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Quality
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const isActive = (filterType || "ALL") === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/partners?type=${tab.value}${sortOption ? `&sort=${sortOption}` : ""}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Partners Grid */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>

          {/* Contextual Link to Impact & Transparency */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col justify-between p-6">
              <div>
                <Badge tone="blue">System-Wide Impact</Badge>
                <h3 className="mt-3 text-lg font-bold text-slate-900">Explore ORBIT-Wide Impact</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  See how individual partner feedstock contributions combine to power community clean cooking,
                  reduce landfill methane emissions, and demonstrate circular bioenergy in practice.
                </p>
              </div>
              <div className="mt-6">
                <LinkButton href="/impact" variant="secondary" className="w-full sm:w-auto">
                  <span>View Public Impact Dashboard</span>
                  <ArrowRight size={14} className="ml-1" />
                </LinkButton>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-6">
              <div>
                <Badge tone="amber">Integrity & Governance</Badge>
                <h3 className="mt-3 text-lg font-bold text-slate-900">How Recognition is Calculated</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  ORBIT strictly rewards sorting quality, low contamination, and weekly consistency.
                  Partners are never ranked by gross waste volume to prevent wasteful habits.
                </p>
              </div>
              <div className="mt-6">
                <LinkButton href="/methodology" variant="secondary" className="w-full sm:w-auto">
                  <span>Read Recognition Methodology</span>
                  <ArrowRight size={14} className="ml-1" />
                </LinkButton>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
