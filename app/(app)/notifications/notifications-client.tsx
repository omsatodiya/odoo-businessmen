"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isRead, markAllAsRead, markAsRead } from "@/lib/notification-read-state";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notification-slice";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
  type NotificationItem,
  type NotificationSeverity,
} from "@/types/notification-types";

const SEVERITY_STYLE: Record<NotificationSeverity, string> = {
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  primary: "bg-primary/15 text-primary",
};

const CATEGORY_ORDER: NotificationCategory[] = [
  "LICENSE_EXPIRED",
  "VEHICLE_IN_SHOP",
  "LICENSE_EXPIRING",
  "ROUTE_DEVIATION",
  "TRIP_IN_PROGRESS",
  "TRIP_COMPLETED",
];

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function NotificationsClient() {
  const { items, loading, fetch } = useNotificationStore();
  const router = useRouter();

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Tracks IDs marked read via a click during this session. Merged below
  // with localStorage's persisted read state — derived at render time, no
  // effect needed to keep it in sync with `items` arriving asynchronously.
  const [sessionReadIds, setSessionReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const readIds = useMemo(() => {
    const merged = new Set(sessionReadIds);
    for (const item of items) {
      if (isRead(item.id)) merged.add(item.id);
    }
    return merged;
  }, [items, sessionReadIds]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "ALL" && item.category !== typeFilter) return false;
      if (statusFilter === "UNREAD" && readIds.has(item.id)) return false;
      if (statusFilter === "READ" && !readIds.has(item.id)) return false;
      if (dateFrom && item.timestamp < new Date(dateFrom).toISOString()) return false;
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (item.timestamp > toEnd.toISOString()) return false;
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, dateFrom, dateTo, readIds]);

  const handleView = (item: NotificationItem) => {
    markAsRead(item.id);
    setSessionReadIds((prev) => new Set(prev).add(item.id));
    router.push(item.href);
  };

  const handleMarkAllRead = () => {
    markAllAsRead(items.map((item) => item.id));
    setSessionReadIds(new Set(items.map((item) => item.id)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="View and manage all your notifications across trips, maintenance, licenses, and fleet updates."
        actions={
          items.length > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {CATEGORY_ORDER.map((category) => (
              <SelectItem key={category} value={category}>
                {NOTIFICATION_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="UNREAD">Unread</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="h-8 cursor-pointer border border-input bg-transparent px-2.5 text-sm text-foreground"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="h-8 cursor-pointer border border-input bg-transparent px-2.5 text-sm text-foreground"
        />
      </FilterBar>

      <div className="border border-border bg-card">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {items.length === 0 ? "You're all caught up." : "No notifications match these filters."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const unread = !readIds.has(item.id);
              return (
                <div key={item.id} className={cn("flex items-start gap-3 p-4", unread && "bg-primary/[0.03]")}>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      SEVERITY_STYLE[item.severity]
                    )}
                  >
                    <Bell className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("border-0 font-medium", SEVERITY_STYLE[item.severity])}>
                        {NOTIFICATION_CATEGORY_LABELS[item.category]}
                      </Badge>
                      {unread ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                    </div>
                    <p className="text-sm text-foreground">{item.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <button
                        onClick={() => handleView(item)}
                        className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
