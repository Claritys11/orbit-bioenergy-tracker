import { formatGas, formatKg } from "@/lib/utils";

type ReportBriefInput = {
  acceptedWasteKg: number;
  rejectedWasteKg: number;
  verifiedGasM3: number;
  allocatedGasM3?: number;
  fulfilledGasM3?: number;
  estimatedNetBenefit?: number;
};

export function buildReportBrief(input: ReportBriefInput) {
  const gross = input.acceptedWasteKg + input.rejectedWasteKg;
  const contamination = gross > 0 ? (input.rejectedWasteKg / gross) * 100 : 0;
  const allocationGap =
    input.allocatedGasM3 !== undefined && input.fulfilledGasM3 !== undefined
      ? Math.max(input.allocatedGasM3 - input.fulfilledGasM3, 0)
      : undefined;

  const highlights = [
    `${formatKg(input.acceptedWasteKg)} accepted organic waste is supported by operator inspection records.`,
    `${formatGas(input.verifiedGasM3)} verified biogas is separated from estimates and assumptions.`,
    `Current contamination is ${contamination.toFixed(1)}%, so rejected mass is excluded from contribution scoring.`,
  ];

  if (allocationGap !== undefined) {
    highlights.push(`${formatGas(allocationGap)} allocated gas is not yet fulfilled and should not be reported as delivered energy.`);
  }

  if (input.estimatedNetBenefit !== undefined) {
    highlights.push(`Estimated net benefit is Rp ${Math.round(input.estimatedNetBenefit).toLocaleString("id-ID")} using pilot assumptions.`);
  }

  return {
    title: "AI-ready report brief",
    note: "Generated from verified app data with deterministic rules. Connect an AI provider later for narrative variants and recommendations.",
    highlights,
  };
}

