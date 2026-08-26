import { Badge, Card } from "@/components/ui";
import { humanise } from "@/lib/utils";

export function PublicActivityFeed({
  items,
}: {
  items: Array<{ id: string; action: string; entityType: string; at: string }>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Public activity feed</h2>
        <Badge tone="amber">Sanitised</Badge>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold">{humanise(item.action)}</p>
            <p className="text-sm text-slate-500">{item.entityType} event, {new Date(item.at).toLocaleString("en-US")}</p>
          </div>
        )) : <p className="text-sm text-slate-500">No public-safe activity yet.</p>}
      </div>
    </Card>
  );
}
