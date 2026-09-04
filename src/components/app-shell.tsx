"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  Factory,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Recycle,
  ScanLine,
  Search,
  Settings,
  ShieldAlert,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions";
import { can, type Permission } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { roleDashboardPath } from "@/lib/role-routes";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission | Permission[];
};

const groups: Array<{
  label: string;
  items: NavItem[];
}> = [
  { label: "Overview", items: [{ href: "ROLE_DASHBOARD", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Waste Operations",
    items: [
      { href: "/admin/containers", label: "QR Containers", icon: QrCode, permission: "manage_containers" },
      { href: "/batches", label: "Waste Batches", icon: QrCode, permission: "view_batches" },
      { href: "/batches/new", label: "Register Organic Load", icon: Recycle, permission: "create_waste_record" },
      { href: "/scan", label: "Receive Container", icon: ScanLine, permission: "receive_container" },
      { href: "/operations/pickups", label: "Pickups", icon: CalendarCheck, permission: ["request_pickup", "respond_pickup_request", "manage_pickup_logistics"] },
      { href: "/operations/inspections", label: "Inspections", icon: ClipboardCheck, permission: "inspect_batch" },
    ],
  },
  {
    label: "Bioenergy Operations",
    items: [
      { href: "/operations/conversions", label: "Conversion Cycles", icon: Factory, permission: "record_conversion" },
      { href: "/operations/allocations", label: "Allocations", icon: Zap, permission: "manage_system" },
      { href: "/operations/fulfilment", label: "Energy Fulfilment", icon: Gauge, permission: "fulfil_allocation" },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/reports/impact", label: "Impact", icon: BarChart3, permission: "view_reports" },
      { href: "/reports/sustainability", label: "Sustainability", icon: FileText, permission: "view_reports" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/facilities", label: "Facilities", icon: Factory, permission: "manage_system" },
      { href: "/admin/users", label: "Organisations and Users", icon: Users, permission: "manage_system" },
      { href: "/admin/safety", label: "Safety", icon: ShieldAlert, permission: "manage_safety" },
      { href: "/admin/audit", label: "Audit Logs", icon: FileText, permission: "view_audit" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "manage_system" },
    ],
  },
];

function resolveHref(href: string, role: Role) {
  return href === "ROLE_DASHBOARD" ? roleDashboardPath(role) : href;
}

function isItemVisible(role: Role, item: NavItem): boolean {
  if (!item.permission) return true;
  if (Array.isArray(item.permission)) {
    return item.permission.some((p) => can(role, p));
  }
  return can(role, item.permission);
}

function NavContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-5" aria-label="Workspace navigation">
      {groups.map((group) => {
        const items = group.items.filter((item) => isItemVisible(role, item));
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
            <div className="grid gap-1">
              {items.map((item: NavItem) => {
                const Icon = item.icon;
                const href = resolveHref(item.href, role);
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white",
                      active && "bg-white text-slate-950 hover:bg-white hover:text-slate-950",
                    )}
                  >
                    <Icon size={18} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

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
  const [open, setOpen] = useState(false);
  const dashboardHref = roleDashboardPath(role);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 border-r border-[var(--orbit-primary)]/20 bg-gradient-to-b from-[#000FC4] via-[#000FC4] to-[#7209B7] text-white lg:block">
        <div className="flex h-full flex-col">
          <Link href={dashboardHref} className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#00C972] text-black shadow-sm">
              <Recycle size={22} aria-hidden />
            </span>
            <span><span className="block text-lg font-bold tracking-wide">ORBIT</span><span className="block text-xs text-blue-100/80">Operational workspace</span></span>
          </Link>
          <div className="flex-1 overflow-y-auto px-3 py-4"><NavContent role={role} /></div>
          <form action={logoutAction} className="border-t border-white/10 p-4">
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="mb-2 text-xs text-blue-100/70">{organisationName}</p>
            <span className="inline-flex rounded bg-[#00C972] px-2 py-0.5 text-xs font-bold text-black">
              {role}
            </span>
            <Button variant="secondary" className="mt-3 w-full border-white/20 bg-white/10 text-white hover:bg-white/20">
              <LogOut size={16} aria-hidden /> Log out
            </Button>
          </form>
        </div>
      </aside>
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:ml-72">
        <div className="flex items-center gap-3">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={22} aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-black">{organisationName ?? "ORBIT"}</p>
            <p className="text-xs text-slate-500">Role-aware workspace</p>
          </div>
          <div className="hidden min-h-10 w-72 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-500 md:flex">
            <Search size={16} aria-hidden /> Search batches, cycles, allocations
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-black hover:border-[#000FC4]" aria-label="Notifications">
            <Bell size={18} aria-hidden />
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[min(360px,88vw)] overflow-y-auto bg-gradient-to-b from-[#000FC4] to-[#7209B7] p-4 text-white">
            <div className="mb-5 flex items-center justify-between">
              <Link href={dashboardHref} className="flex items-center gap-2 font-bold"><Recycle size={22} /> ORBIT</Link>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-white/20" onClick={() => setOpen(false)} aria-label="Close navigation">
                <X size={20} aria-hidden />
              </button>
            </div>
            <NavContent role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <main className="px-4 py-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
