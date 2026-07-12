"use client";

import { useEffect, useState } from "react";
import { Menu, Search, Bell, LayoutGrid, Sun, Moon } from "lucide-react";
import type { Role } from "@prisma/client";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";
import { useUiStore } from "@/store/ui-slice";
import { CommandMenu } from "@/components/layout/command-menu";
import type { Access, Resource } from "@/lib/rbac";

export function AppTopbar({
  user,
  permissions,
}: {
  user: { name: string; role: Role };
  permissions: Record<Resource, Access>;
}) {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
        <Menu className="size-4" />
      </Button>

      <div className="relative w-full max-w-sm cursor-pointer" onClick={() => setOpen(true)}>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search across fleet... (Ctrl+K)" className="pl-8 bg-card/40 border-border cursor-pointer" readOnly />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-muted-foreground hover:text-foreground" title="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-muted-foreground hover:text-foreground" title="Apps">
          <LayoutGrid className="size-4" />
        </Button>
        <UserMenu user={user} />
      </div>

      <CommandMenu open={open} onOpenChange={setOpen} permissions={permissions} />
    </header>
  );
}
