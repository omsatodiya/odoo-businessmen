"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Loader2, MoreHorizontal, Plus, Trash2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { FilterSearchInput } from "@/components/shared/filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMaintenanceStore } from "@/store/maintenance-slice";
import type { MaintenanceLogWithVehicle } from "@/store/maintenance-slice";
import { MaintenanceFormModal } from "@/components/maintenance/maintenance-form-modal";
import { cn } from "@/lib/utils";

interface MaintenanceLogTableProps {
  isFullAccess: boolean;
}

export function MaintenanceLogTable({ isFullAccess }: MaintenanceLogTableProps) {
  const { items, fetch: fetchLogs, loading, closeLog, deleteLog } = useMaintenanceStore();
  const [closingId, setClosingId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<MaintenanceLogWithVehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form modal visibility state
  const [formModalOpen, setFormModalOpen] = useState(false);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (log) =>
          log.vehicle.regNo.toLowerCase().includes(q) ||
          log.vehicle.name.toLowerCase().includes(q) ||
          log.type.toLowerCase().includes(q) ||
          (log.notes && log.notes.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter((log) => log.status === statusFilter);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
      }
      if (sortBy === "OLDEST") {
        return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
      }
      if (sortBy === "COST_DESC") {
        return Number(b.cost) - Number(a.cost);
      }
      if (sortBy === "COST_ASC") {
        return Number(a.cost) - Number(b.cost);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, statusFilter, sortBy]);

  // Reset current page when filtered logs count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAndSortedItems.length]);

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

  // Paginated logs
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(start, start + itemsPerPage);
  }, [filteredAndSortedItems, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Vehicle Maintenance"
        description="Track and manage vehicle service history and shop status."
        actions={
          isFullAccess && (
            <Button
              onClick={() => setFormModalOpen(true)}
              className="bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-md h-9 px-4 border border-border shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-4 stroke-[3]" /> Add Log
            </Button>
          )
        }
      />

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border bg-card/25 p-3">
        <FilterSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search reg no, service type..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[125px] cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="cursor-pointer">All Statuses</SelectItem>
              <SelectItem value="ACTIVE" className="cursor-pointer">Active</SelectItem>
              <SelectItem value="COMPLETED" className="cursor-pointer">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[140px] cursor-pointer">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEWEST" className="cursor-pointer">Newest First</SelectItem>
              <SelectItem value="OLDEST" className="cursor-pointer">Oldest First</SelectItem>
              <SelectItem value="COST_DESC" className="cursor-pointer">Highest Cost</SelectItem>
              <SelectItem value="COST_ASC" className="cursor-pointer">Lowest Cost</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer text-muted-foreground hover:text-foreground border-border bg-transparent hover:bg-muted/50"
            title="Reset Filters"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setSortBy("NEWEST");
            }}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main logs card */}
      <div className="border border-border bg-card rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/10">
          <h3 className="text-sm font-semibold">Service Logs</h3>
        </div>

        {/* Table wrapper for desktop screens */}
        <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 border-b border-border">
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">VEHICLE</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">SERVICE TYPE</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">COST</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">STATUS</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">OPENED AT</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">COMPLETED AT</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">NOTES</TableHead>
                {isFullAccess && (
                  <TableHead className="text-right font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">ACTIONS</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isFullAccess ? 8 : 7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Loading maintenance logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isFullAccess ? 8 : 7} className="h-32 text-center text-muted-foreground">
                    No maintenance service records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((log) => {
                  const regNo = log.vehicle.regNo;
                  const vehicleName = log.vehicle.name;
                  const typeWords = log.type.split(" ");
                  
                  // Format cost alignment with leading zeros if necessary
                  const formatted = Number(log.cost).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const alignedCost = formatted.match(/^\d(?!\d)/) ? `0${formatted}` : formatted;

                  let statusBadge = "border-success/30 bg-success/10 text-success";
                  if (log.status === "ACTIVE") {
                    statusBadge = "border-warning/30 bg-warning/10 text-warning";
                  }

                  const openedDate = new Date(log.openedAt);
                  const openedTop = format(openedDate, "d MMM");
                  const openedBottom = format(openedDate, "yyyy");

                  let closedTop = "";
                  let closedBottom = "";
                  if (log.closedAt) {
                    const closedDate = new Date(log.closedAt);
                    closedTop = format(closedDate, "d MMM");
                    closedBottom = format(closedDate, "yyyy");
                  }

                  return (
                    <TableRow key={log.id} className="border-b border-border transition-colors hover:bg-muted/30">
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-foreground">{regNo}</span>
                          <span className="text-xs text-muted-foreground">{vehicleName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col font-medium text-foreground leading-tight">
                          {typeWords.map((word, idx) => (
                            <span key={idx}>{word}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-sm leading-tight text-foreground/80">
                        <div className="flex flex-col leading-tight">
                          <span>₹</span>
                          <span className="font-semibold">{alignedCost}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-block font-semibold px-2 py-0.5 text-[10px] border rounded tracking-wide text-center uppercase whitespace-nowrap",
                            statusBadge
                          )}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col text-xs text-muted-foreground leading-tight">
                          <span>{openedTop}</span>
                          <span>{openedBottom}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        {log.closedAt ? (
                          <div className="flex flex-col text-xs text-muted-foreground leading-tight">
                            <span>{closedTop}</span>
                            <span>{closedBottom}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-muted-foreground/80 max-w-[200px] truncate" title={log.notes || undefined}>
                        {log.notes || "—"}
                      </TableCell>
                      {isFullAccess && (
                        <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                              <DropdownMenuLabel className="text-xs">Options</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-border" />
                              {log.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  className="text-xs cursor-pointer focus:bg-muted"
                                  onClick={() => handleComplete(log.id)}
                                  disabled={closingId === log.id}
                                >
                                  <Check className="mr-2 h-3.5 w-3.5 text-success" />
                                  Complete Service
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => handleDeleteClick(log)}
                                disabled={closingId === log.id}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Log
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table representation for mobile screens */}
        <div className="block md:hidden divide-y divide-border border-t border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading logs...</span>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No logs found.
            </div>
          ) : (
            paginatedItems.map((log) => {
              const formatted = Number(log.cost).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const alignedCost = formatted.match(/^\d(?!\d)/) ? `0${formatted}` : formatted;

              let statusBadge = "border-success/30 bg-success/10 text-success";
              if (log.status === "ACTIVE") {
                statusBadge = "border-warning/30 bg-warning/10 text-warning";
              }

              return (
                <div key={log.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">{log.vehicle.regNo}</span>
                      <span className="text-xs text-muted-foreground">{log.vehicle.name}</span>
                    </div>
                    <span
                      className={cn(
                        "inline-block font-semibold px-2 py-0.5 text-[10px] border rounded tracking-wide text-center uppercase whitespace-nowrap",
                        statusBadge
                      )}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                    <div>Type: <span className="text-foreground">{log.type}</span></div>
                    <div>Cost: <span className="text-foreground font-semibold">₹ {alignedCost}</span></div>
                    <div>Opened: <span className="text-foreground">{format(new Date(log.openedAt), "d MMM yyyy")}</span></div>
                    <div>Completed: <span className="text-foreground">{log.closedAt ? format(new Date(log.closedAt), "d MMM yyyy") : "—"}</span></div>
                  </div>

                  {log.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                      <span className="font-sans font-semibold text-[10px] uppercase block tracking-wider mb-0.5 text-muted-foreground/80">Notes:</span>
                      <p className="line-clamp-2">{log.notes}</p>
                    </div>
                  )}

                  {isFullAccess && (
                    <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {log.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-success/40 hover:bg-success/10 hover:text-success"
                          onClick={() => handleComplete(log.id)}
                          disabled={closingId === log.id}
                        >
                          <Check className="size-3 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClick(log)}
                        disabled={closingId === log.id}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {paginatedItems.length} of {filteredAndSortedItems.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="h-8 bg-card border-border hover:bg-muted text-foreground text-xs px-3 rounded-md cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 bg-card border-border hover:bg-muted text-foreground text-xs px-3 rounded-md cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

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

      <MaintenanceFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
      />
    </div>
  );
}
