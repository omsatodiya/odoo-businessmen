"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAsRead } from "@/lib/notification-read-state";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notification-slice";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationItem,
  type NotificationSeverity,
} from "@/types/notification-types";

const SEVERITY_STYLE: Record<NotificationSeverity, string> = {
  destructive: "text-destructive",
  warning: "text-warning",
  success: "text-success",
  primary: "text-primary",
};

function relativeLabel(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();
  const days = Math.round(Math.abs(diffMs) / 86_400_000);
  if (days === 0) return "today";
  return diffMs < 0 ? `${days}d ago` : `in ${days}d`;
}

export function NotificationsMenu() {
  const router = useRouter();
  const { items, loading, fetch } = useNotificationStore();

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const count = items.length;

  const handleSelect = (item: NotificationItem) => {
    markAsRead(item.id);
    router.push(item.href);
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void fetch();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 cursor-pointer text-muted-foreground hover:text-foreground"
          title="Notifications"
        >
          <Bell className="size-4" />
          {count > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive font-mono text-[10px] font-semibold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          <span>Notifications</span>
          {count > 0 ? <span className="font-mono">{count}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading && items.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            You&apos;re all caught up.
          </div>
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto">
            {items.slice(0, 8).map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex items-start gap-2 py-2 whitespace-normal"
              >
                <Bell className={cn("mt-0.5 size-4 shrink-0", SEVERITY_STYLE[item.severity])} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {NOTIFICATION_CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {relativeLabel(item.timestamp)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/notifications")}
          className="justify-center text-sm font-medium text-primary"
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
