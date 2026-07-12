"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Fuel,
  LayoutDashboard,
  Route,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { can, type Resource } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-slice";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource: Resource;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, resource: "DASHBOARD" },
  { label: "Fleet", href: "/fleet", icon: Truck, resource: "FLEET" },
  { label: "Drivers", href: "/drivers", icon: Users, resource: "DRIVERS" },
  { label: "Trips", href: "/trips", icon: Route, resource: "TRIPS" },
  { label: "Maintenance", href: "/maintenance", icon: Wrench, resource: "FLEET" },
  { label: "Fuel & Expenses", href: "/fuel-expenses", icon: Fuel, resource: "FUEL_EXPENSES" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, resource: "ANALYTICS" },
  { label: "Settings", href: "/settings", icon: Settings, resource: "SETTINGS" },
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const items = NAV_ITEMS.filter((item) => can(role, item.resource, "VIEW"));

  return (
    <>
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              T
            </div>
            <span className="text-base font-semibold">TransitOps</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
