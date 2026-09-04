import { DataConfidenceBadge } from "@/components/ui";
import type { Confidence } from "@/lib/public-data";

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return <DataConfidenceBadge level={value} />;
}
