import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Factory,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  QrCode,
  Recycle,
  ScanLine,
  Settings,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { can } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/batches", label: "Waste batches", icon: QrCode },
  { href: "/batches/new", label: "Create batch", icon: Recycle, permission: "create_batch" as const },
  { href: "/scan", label: "QR scanner", icon: ScanLine },
  { href: "/operations/inspections", label: "Inspections", icon: ClipboardCheck, permission: "inspect_batch" as const },
  { href: "/operations/pickups", label: "Pickup schedule", icon: CalendarCheck, permission: "schedule_pickup" as const },
  { href: "/operations/conversions", label: "Conversion cycles", icon: Factory, permission: "record_conversion" as const },
  { href: "/operations/allocations", label: "Allocations", icon: Zap, permission: "calculate_allocation" as const },
  { href: "/operations/fulfilment", label: "Fulfilment", icon: Gauge, permission: "fulfil_allocation" as const },
  { href: "/reports/impact", label: "Impact analytics", icon: BarChart3 },
  { href: "/reports/sustainability", label: "Sustainability", icon: FileText },
  { href: "/admin/facilities", label: "Facilities", icon: Factory, permission: "manage_org" as const },
  { href: "/admin/users", label: "Organisations & users", icon: Users, permission: "manage_org" as const },
  { href: "/admin/safety", label: "Safety", icon: ShieldAlert, permission: "manage_safety" as const },
  { href: "/admin/audit", label: "Audit logs", icon: FileText, permission: "view_audit" as const },
  { href: "/admin/settings", label: "System settings", icon: Settings, permission: "manage_system" as const },
  { href: "/profile", label: "Profile", icon: Users },
];

export function AppShell({
  children,
  role,
  name,
  organisationName,
}: {
  children: React.ReactNode;
  role: Role;
  name?: string | null;
  organisationName?: string;
}) {
  const visible = nav.filter((item) => !item.permission || can(role, item.permission));
  return (
    <div className="min-h-screen bg-[#f6f8f5]">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-amber-400 text-slate-950">
              <Recycle size={22} aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-bold">ORBIT</span>
              <span className="block text-xs text-slate-300">Bioenergy loop control</span>
            </span>
          </Link>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visible.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={logoutAction} className="border-t border-white/10 p-4">
            <p className="text-sm font-semibold">{name}</p>
            <p className="mb-3 text-xs text-slate-300">{organisationName ?? role}</p>
            <Button variant="secondary" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20">
              <LogOut size={16} aria-hidden />
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-950">
            <Recycle size={22} className="text-teal-700" aria-hidden />
            ORBIT
          </Link>
          <form action={logoutAction}>
            <Button variant="ghost" className="px-2">
              <LogOut size={18} aria-label="Log out" />
            </Button>
          </form>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {visible.slice(0, 10).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-4 py-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
