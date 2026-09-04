"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Factory,
  FileText,
  Gauge,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Recycle,
  ScanLine,
  Settings,
  ShieldAlert,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import type { Role } from "@/lib/domain/types";
import { roleDashboardPath } from "@/lib/role-routes";
import { cn } from "@/lib/utils";
import { Badge, Button } from "./ui";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const roleDisplayNames: Record<Role, string> = {
  CANTEEN_STAFF: "Canteen Team",
  SCHOOL_ADMIN: "School Admin",
  OPERATOR: "Logistics Operator",
  COMMUNITY_PARTNER: "Community Facility",
  STUDENT: "Student Observer",
  SUPER_ADMIN: "System Admin",
};

const roleTone: Record<Role, "green" | "blue" | "amber" | "purple" | "slate"> = {
  CANTEEN_STAFF: "blue",
  SCHOOL_ADMIN: "green",
  OPERATOR: "amber",
  COMMUNITY_PARTNER: "green",
  STUDENT: "purple",
  SUPER_ADMIN: "slate",
};

function getNavGroupsForRole(role: Role): Array<{ label: string; items: NavItem[] }> {
  const dashHref = roleDashboardPath(role);

  switch (role) {
    case "CANTEEN_STAFF":
      return [
        {
          label: "Overview",
          items: [{ href: dashHref, label: "Dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Waste",
          items: [
            { href: "/batches/new", label: "Register Waste", icon: Recycle },
            { href: "/batches", label: "My Waste", icon: QrCode },
          ],
        },
        {
          label: "Impact",
          items: [{ href: "/reports/impact", label: "My Impact", icon: BarChart3 }],
        },
      ];

    case "SCHOOL_ADMIN":
      return [
        {
          label: "Overview",
          items: [{ href: dashHref, label: "Dashboard", icon: LayoutDashboard }],
        },
        {
          label: "School Operations",
          items: [
            { href: "/batches", label: "School Waste", icon: QrCode },
            { href: "/operations/pickups", label: "Pickup Requests", icon: CalendarCheck },
          ],
        },
        {
          label: "Impact",
          items: [
            { href: "/reports/impact", label: "Impact Report", icon: BarChart3 },
            { href: "/reports/sustainability", label: "Sustainability", icon: FileText },
          ],
        },
      ];

    case "OPERATOR":
      return [
        {
          label: "Overview",
          items: [{ href: dashHref, label: "Dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Logistics",
          items: [
            { href: "/operations/pickups", label: "Pickup Requests", icon: CalendarCheck },
            { href: "/operations/pickups", label: "Logistics Operations", icon: Truck },
            { href: "/batches", label: "Pickup Loads", icon: QrCode },
          ],
        },
        {
          label: "Reports",
          items: [{ href: "/reports/impact", label: "Logistics Impact", icon: BarChart3 }],
        },
      ];

    case "COMMUNITY_PARTNER":
      return [
        {
          label: "Overview",
          items: [{ href: dashHref, label: "Dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Incoming Waste",
          items: [
            { href: "/scan", label: "Receive Container", icon: ScanLine },
            { href: "/batches", label: "Incoming Waste", icon: QrCode },
            { href: "/operations/inspections", label: "Quality Inspection", icon: ClipboardCheck },
          ],
        },
        {
          label: "Bioenergy",
          items: [
            { href: "/operations/conversions", label: "Conversion Cycles", icon: Factory },
            { href: "/operations/fulfilment", label: "Energy Fulfilment", icon: Gauge },
          ],
        },
        {
          label: "Reports",
          items: [{ href: "/reports/impact", label: "Facility Impact", icon: BarChart3 }],
        },
      ];

    case "STUDENT":
      return [
        {
          label: "Explore",
          items: [
            { href: "/transparency", label: "Transparency", icon: FileText },
            { href: "/impact", label: "Impact Explorer", icon: BarChart3 },
            { href: "/trace/demo", label: "Trace Explorer", icon: QrCode },
          ],
        },
      ];

    case "SUPER_ADMIN":
    default:
      return [
        {
          label: "Overview",
          items: [{ href: dashHref, label: "Dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Fleet & Resources",
          items: [
            { href: "/admin/containers", label: "QR Containers", icon: QrCode },
            { href: "/batches", label: "Waste Batches", icon: Layers },
            { href: "/operations/pickups", label: "Pickups", icon: CalendarCheck },
            { href: "/operations/inspections", label: "Inspections", icon: ClipboardCheck },
            { href: "/operations/conversions", label: "Conversions", icon: Factory },
            { href: "/operations/allocations", label: "Allocations", icon: Zap },
            { href: "/operations/fulfilment", label: "Fulfilment", icon: Gauge },
          ],
        },
        {
          label: "Reports",
          items: [
            { href: "/reports/impact", label: "Impact Reports", icon: BarChart3 },
            { href: "/reports/sustainability", label: "Sustainability", icon: FileText },
          ],
        },
        {
          label: "Management",
          items: [
            { href: "/admin/users", label: "Organisations & Users", icon: Users },
            { href: "/admin/facilities", label: "Facilities", icon: Factory },
            { href: "/admin/safety", label: "Safety Alerts", icon: ShieldAlert },
            { href: "/admin/audit", label: "Audit Logs", icon: FileText },
            { href: "/admin/settings", label: "Platform Settings", icon: Settings },
          ],
        },
      ];
  }
}

function NavContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = getNavGroupsForRole(role);

  return (
    <nav className="grid gap-5" aria-label="Workspace navigation">
      {groups.map((group) => {
        if (!group.items.length) return null;
        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {group.label}
            </p>
            <div className="grid gap-1">
              {group.items.map((item: NavItem) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                      active
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn("shrink-0", active ? "text-[var(--orbit-primary)]" : "text-slate-400")}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
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
  children: ReactNode;
  role: Role;
  name?: string | null;
  organisationName?: string;
}) {
  const [open, setOpen] = useState(false);
  const dashboardHref = roleDashboardPath(role);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      {/* Desktop Persistent Sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col justify-between">
          {/* Brand Header */}
          <div>
            <Link
              href={dashboardHref}
              className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5 transition hover:opacity-90"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#00C972] to-[#059669] text-black shadow-xs font-black">
                <Recycle size={22} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-lg font-black tracking-wider text-white">ORBIT</span>
                <span className="block text-[11px] text-emerald-400 font-medium tracking-wide">
                  Bioenergy Infrastructure
                </span>
              </div>
            </Link>

            {/* Role Header Badge */}
            <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Workspace</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {organisationName ?? "ORBIT"}
                </span>
                <Badge tone={roleTone[role]} className="text-[10px] px-1.5 py-0.5">
                  {roleDisplayNames[role]}
                </Badge>
              </div>
            </div>

            {/* Nav Menu */}
            <div className="overflow-y-auto px-3 py-4 max-h-[calc(100vh-220px)]">
              <NavContent role={role} />
            </div>
          </div>

          {/* User Profile & Logout Area */}
          <div className="border-t border-slate-800/80 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{name ?? "Operational User"}</p>
                <p className="truncate text-[11px] text-slate-400">{organisationName ?? "ORBIT Platform"}</p>
              </div>
            </div>
            <form action={logoutAction} className="mt-3">
              <Button
                variant="secondary"
                className="w-full min-h-9 border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut size={14} aria-hidden="true" /> Log out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md lg:ml-72">
        <div className="flex items-center justify-between gap-3">
          {/* Mobile Menu Trigger & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold text-slate-950">
                  {organisationName ?? "ORBIT"}
                </span>
                <span className="hidden sm:inline-block">
                  <Badge tone={roleTone[role]} className="text-[10px]">
                    {roleDisplayNames[role]}
                  </Badge>
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Operational Bioenergy Supply Chain System
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {role === "CANTEEN_STAFF" ? (
              <Link
                href="/batches/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--orbit-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90"
              >
                <Recycle size={14} />
                <span>Mark Ready</span>
              </Link>
            ) : role === "SCHOOL_ADMIN" ? (
              <Link
                href="/operations/pickups"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--orbit-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90"
              >
                <CalendarCheck size={14} />
                <span className="hidden xs:inline">Request Pickup</span>
              </Link>
            ) : role === "COMMUNITY_PARTNER" ? (
              <Link
                href="/scan"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                <ScanLine size={14} />
                <span className="hidden xs:inline">Receive Container</span>
              </Link>
            ) : null}

            <Link
              href="/transparency"
              className="hidden sm:grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--orbit-primary)] hover:text-[var(--orbit-primary)]"
              title="Public Transparency"
            >
              <FileText size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[min(320px,85vw)] overflow-y-auto bg-slate-950 p-5 text-white shadow-2xl flex flex-col justify-between">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 font-bold"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-black">
                    <Recycle size={18} />
                  </span>
                  <span className="text-base font-extrabold text-white">ORBIT</span>
                </Link>
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="mb-5 rounded-lg bg-slate-900 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logged in as</p>
                <p className="mt-0.5 text-xs font-bold text-white truncate">{name}</p>
                <p className="text-[11px] text-slate-400 truncate">{organisationName}</p>
                <div className="mt-2">
                  <Badge tone={roleTone[role]} className="text-[10px]">
                    {roleDisplayNames[role]}
                  </Badge>
                </div>
              </div>

              <NavContent role={role} onNavigate={() => setOpen(false)} />
            </div>

            <form action={logoutAction} className="border-t border-slate-800 pt-4 mt-6">
              <Button
                variant="secondary"
                className="w-full min-h-10 border-slate-800 bg-slate-900 text-xs text-slate-200"
              >
                <LogOut size={14} aria-hidden="true" /> Log out
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Main Content Viewport */}
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
