"use client";

import { useEffect, useState } from "react";
import { useMaintenanceStore, MaintenanceLogWithVehicle } from "@/store/maintenance-slice";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface MaintenanceLogTableProps {
  isFullAccess: boolean;
}

export function MaintenanceLogTable({ isFullAccess }: MaintenanceLogTableProps) {
  const { items, fetch: fetchLogs, loading, closeLog, deleteLog } = useMaintenanceStore();
  const [closingId, setClosingId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<MaintenanceLogWithVehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleComplete = async (logId: string) => {
    setClosingId(logId);
    try {
      await closeLog(logId);
      toast.success("Maintenance completed successfully. Vehicle is now AVAILABLE.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete maintenance");
    } finally {
      setClosingId(null);
    }
  };

  const handleDeleteClick = (log: MaintenanceLogWithVehicle) => {
    setLogToDelete(log);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLog(logToDelete.id);
      toast.success("Maintenance log deleted successfully.");
      setDeleteConfirmOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete log");
    } finally {
      setIsDeleting(false);
      setLogToDelete(null);
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
      header: <span className="pr-6 block">Actions</span>,
      className: "text-right w-36",
      cell: (log) => {
        const isClosing = closingId === log.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {log.status === "ACTIVE" && (
              <Button
                size="xs"
                variant="outline"
                className="h-7 text-xs border-success/40 hover:bg-success/10 hover:text-success"
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
            )}
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDeleteClick(log)}
              disabled={isClosing}
              title="Delete log"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Maintenance Log"
        description={
          logToDelete
            ? `Are you sure you want to delete the maintenance log for vehicle ${logToDelete.vehicle.regNo} (${logToDelete.type})? This will remove the record permanently. If active, the vehicle will be returned to Available.`
            : ""
        }
        confirmLabel="Delete Log"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
