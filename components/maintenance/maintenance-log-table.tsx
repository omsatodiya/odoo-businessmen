"use client";

import { useEffect, useState } from "react";
import { useMaintenanceStore, MaintenanceLogWithVehicle } from "@/store/maintenance-slice";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

interface MaintenanceLogTableProps {
  role: Role;
}

export function MaintenanceLogTable({ role }: MaintenanceLogTableProps) {
  const { items, fetch: fetchLogs, loading, closeLog } = useMaintenanceStore();
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const isFullAccess = can(role, "FLEET", "FULL");

  const handleComplete = async (logId: string) => {
    setClosingId(logId);
    try {
      await closeLog(logId);
      toast.success("Maintenance completed successfully. Vehicle is now AVAILABLE.");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete maintenance");
    } finally {
      setClosingId(null);
    }
  };

  const columns: ColumnDef<MaintenanceLogWithVehicle>[] = [
    {
      header: "Vehicle",
      cell: (log) => (
        <div className="flex flex-col">
          <span className="font-semibold">{log.vehicle.regNo}</span>
          <span className="text-xs text-muted-foreground">{log.vehicle.name}</span>
        </div>
      ),
    },
    {
      header: "Service Type",
      cell: (log) => <span className="font-medium">{log.type}</span>,
    },
    {
      header: "Cost",
      cell: (log) => {
        const formatted = Number(log.cost).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const aligned = formatted.match(/^\d(?!\d)/) ? `0${formatted}` : formatted;
        return (
          <span className="font-mono tabular-nums text-sm">
            ₹ {aligned}
          </span>
        );
      },
      className: "text-right",
    },
    {
      header: "Status",
      cell: (log) => <StatusBadge status={log.status} />,
    },
    {
      header: "Opened At",
      cell: (log) => (
        <span className="text-xs text-muted-foreground">
          {new Date(log.openedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Completed At",
      cell: (log) => (
        <span className="text-xs text-muted-foreground">
          {log.closedAt
            ? new Date(log.closedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      header: "Notes",
      cell: (log) => (
        <span className="text-xs max-w-[200px] truncate block" title={log.notes || undefined}>
          {log.notes || "—"}
        </span>
      ),
    },
  ];

  if (isFullAccess) {
    columns.push({
      header: "Actions",
      className: "text-right w-28",
      cell: (log) => {
        if (log.status !== "ACTIVE") return null;
        const isClosing = closingId === log.id;
        return (
          <Button
            size="xs"
            variant="outline"
            className="h-7 text-xs border-chart-2/40 hover:bg-chart-2/10 hover:text-chart-2"
            onClick={() => handleComplete(log.id)}
            disabled={isClosing}
          >
            {isClosing ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <Check className="size-3 mr-1" />
            )}
            Complete
          </Button>
        );
      },
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold">Service Logs</h3>
      </div>
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        emptyMessage="No maintenance service records found."
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
