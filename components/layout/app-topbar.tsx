"use client";

import { Menu, Search } from "lucide-react";
import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";
import { useUiStore } from "@/store/ui-slice";

export function AppTopbar({ user }: { user: { name: string; role: Role } }) {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="size-4" />
      </Button>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8" disabled />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
