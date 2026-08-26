import { Badge } from "@/components/ui";
import type { Confidence } from "@/lib/public-data";

const tone: Record<Confidence, string> = {
  Measured: "green",
  Estimated: "blue",
  "Simulated Demo": "amber",
  "Pilot Assumption": "amber",
  "Pending Field Validation": "slate",
};

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return <Badge tone={tone[value]}>{value}</Badge>;
}
