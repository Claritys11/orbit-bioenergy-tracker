import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  cell?: (item: T) => ReactNode;
}

export function ResponsiveTable<T extends { id: string | number }>({
  data,
  columns,
  mobileCard,
  emptyState,
  className,
}: {
  data: T[];
  columns: Column<T>[];
  mobileCard: (item: T) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      emptyState ?? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          No records found.
        </div>
      )
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.header || idx} className={cn("px-4 py-3", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                {columns.map((col, idx) => {
                  const content = col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? String(item[col.accessorKey] ?? "")
                    : null;
                  return (
                    <td key={col.header || idx} className={cn("px-4 py-3.5", col.className)}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="grid gap-3 md:hidden">
        {data.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[var(--orbit-primary)]/40"
          >
            {mobileCard(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
