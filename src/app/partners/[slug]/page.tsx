import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  MapPin,
  Recycle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Badge, Card, LinkButton } from "@/components/ui";
import { ContributionCalendar } from "@/components/partners/contribution-calendar";
import { AchievementBadges } from "@/components/partners/achievement-badges";
import { ActivityTimeline } from "@/components/partners/activity-timeline";
import { ShareProfileButton } from "@/components/partners/share-button";
import { getPublicPartnerProfile } from "@/lib/services/partner-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicPartnerProfile(slug);
  if (!profile) {
    return { title: "Partner Not Found | ORBIT" };
  }

  const p = profile.partner;
  const m = profile.metrics;
  return {
    title: `${p.name} — Public Impact Profile | ORBIT`,
    description: `${p.name} has contributed ${m.acceptedMassKg} kg of verified organic waste with ${m.acceptanceRate}% feedstock quality on the ORBIT circular bioenergy network.`,
    openGraph: {
      title: `${p.name} — ORBIT Contribution & Impact`,
      description: `Verified ${m.acceptedMassKg} kg diverted organics · ${m.streak.currentStreak} wk contribution streak · ${m.orbitRecognitionScore} Recognition Score.`,
      type: "website",
    },
  };
}

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicPartnerProfile(slug);

  if (!data) {
    notFound();
  }

  const { partner, streak, metrics, achievements, heatmap, recentActivity, circularImpact } = data;
  const hasContributions = metrics.totalBatches > 0;

  return (
    <>
      <PublicHeader />
      <main id="main" className="bg-[var(--background)] py-10">
        <div className="orbit-container">
          {/* Back Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[var(--orbit-primary)] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Partner Network</span>
            </Link>
            <ShareProfileButton partnerName={partner.name} />
          </div>

          {/* Profile Header Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--orbit-primary)]/10 text-2xl font-extrabold text-[var(--orbit-primary)]">
                  {partner.name.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                      {partner.name}
                    </h1>
                    {partner.isFounding && <Badge tone="amber">Founding Pilot</Badge>}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="font-semibold text-slate-700">{partner.statusLabel}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      {partner.city}
                    </span>
                    <span>·</span>
                    <span>Partner since {new Date(partner.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </div>

                  {/* Recognition Tags */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {streak.currentStreak > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                        <Flame size={14} className="text-amber-600" />
                        <span>{streak.currentStreak} Week Active Streak</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <span>New Partner</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>{metrics.acceptanceRate}% Feedstock Acceptance</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                      <span>{metrics.orbitRecognitionScore} Recognition Score</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="shrink-0 self-start">
                <Badge tone="amber">Demonstration Profile · Simulated Demo</Badge>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          {hasContributions ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accepted Organics</span>
                  <Recycle size={18} className="text-emerald-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {metrics.acceptedMassKg.toFixed(1)} <span className="text-sm font-semibold">kg</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Measured post-inspection ({metrics.grossMassKg.toFixed(1)} kg gross)
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sorting Quality</span>
                  <ShieldCheck size={18} className="text-[var(--orbit-primary)]" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.acceptanceRate}%</p>
                <p className="mt-1 text-xs text-slate-500">
                  {metrics.rejectedMassKg.toFixed(1)} kg rejected contamination
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Streak</span>
                  <Flame size={18} className="text-amber-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {streak.currentStreak} <span className="text-sm font-semibold">weeks</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Longest: {streak.longestStreak} weeks · {streak.totalActiveWeeks} active weeks
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Traceable Biogas</span>
                  <Zap size={18} className="text-blue-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {metrics.traceableGasM3 > 0 ? metrics.traceableGasM3.toFixed(2) : "0.00"}{" "}
                  <span className="text-sm font-semibold">m³</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {metrics.fulfilledGasM3 > 0
                    ? `${metrics.fulfilledGasM3.toFixed(2)} m³ fulfilled benefit`
                    : "Anaerobic conversion share"}
                </p>
              </Card>
            </div>
          ) : (
            <Card className="mt-8 p-6 text-center">
              <h2 className="text-lg font-bold text-slate-900">Contribution Tracking Pending</h2>
              <p className="mt-2 max-w-xl mx-auto text-sm text-slate-600">
                This partner is registered in the ORBIT ecosystem. Once their initial source-sorted organic batch is inspected
                and weighed by the local TPS3R operator, verified metrics and contribution streaks will appear here.
              </p>
            </Card>
          )}

          {/* Circular Bioenergy Impact Card */}
          {hasContributions && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/70 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-950">
                      Circularity & Network Contribution
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 max-w-3xl">
                    {partner.name} has provided <strong>{metrics.acceptedMassKg.toFixed(1)} kg</strong> of verified feedstock
                    ({circularImpact.percentOfNetworkAccepted}% of all ORBIT network organics diverted). This feedstock is tracked
                    directly into <strong>{circularImpact.traceableConversionCycles}</strong> biodigestion cycle(s), avoiding unmanaged
                    landfill degradation and yielding <strong>{circularImpact.traceableGasM3.toFixed(2)} m³</strong> of traceable bioenergy.
                  </p>
                </div>

                <div className="shrink-0 flex gap-2">
                  <LinkButton href="/impact" variant="secondary" className="text-xs">
                    <span>Explore Network Impact</span>
                    <ArrowRight size={14} className="ml-1" />
                  </LinkButton>
                </div>
              </div>
            </div>
          )}

          {/* Heatmap Section */}
          <div className="mt-8">
            <ContributionCalendar heatmap={heatmap} />
          </div>

          {/* Achievements Section */}
          <div className="mt-8">
            <AchievementBadges achievements={achievements} />
          </div>

          {/* Recent Activity Timeline */}
          <div className="mt-8">
            <ActivityTimeline items={recentActivity} />
          </div>

          {/* Integrity & Methodology Disclaimer */}
          <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900">Public Verification & Data Governance</h4>
            <p className="mt-2 leading-relaxed">
              All metrics on this page are calculated deterministically from source batch weighings, operator inspections, and
              conversion cycle logs. ORBIT does not reward raw waste production. Weekly streaks are calculated using ISO calendar weeks
              where at least one inspected batch achieved acceptable contamination levels.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 font-semibold text-[var(--orbit-primary)]">
              <Link href="/methodology" className="hover:underline">Calculation Methodology</Link>
              <Link href="/transparency" className="hover:underline">Transparency Principles</Link>
              <Link href="/about" className="hover:underline">About ORBIT</Link>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
