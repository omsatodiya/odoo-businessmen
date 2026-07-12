"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isPast } from "date-fns";
import { 
  Edit, 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  TriangleAlert,
  Mail
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDriverStore } from "@/store/driver-slice";
import type { DriverWithCompletion } from "@/store/driver-slice";
import { DriverFormModal } from "@/components/drivers/driver-form-modal";
import { cn } from "@/lib/utils";

export default function DriversPage() {
  const { items, loading, error, filters, fetch, setFilter, update } = useDriverStore();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverWithCompletion | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  // Pagination state (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await window.fetch("/api/cron/reminders", { method: "POST" });
      if (!res.ok) throw new Error("Failed to send reminders");
      const json = await res.json();
      
      const count = json.data?.remindersSent?.length || 0;
      if (count > 0) {
        toast.success(`Scan completed. Successfully sent ${count} license expiry reminders.`);
      } else {
        toast.info("Scan completed. No driver licenses expire in exactly 3 or 7 days today.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred while sending reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  // Sync selected driver state when items fetch completes
  const selectedDriver = useMemo(
    () => items.find((d) => d.id === selectedDriverId) ?? null,
    [items, selectedDriverId]
  );

  // Fetch drivers list on mount and filter changes
  useEffect(() => {
    fetch();
  }, [fetch]);

  // Reset page number on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.q, filters.status]);

  const handleStatusToggle = async (status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED") => {
    if (!selectedDriver) return;
    try {
      await update(selectedDriver.id, { status });
      toast.success(`Driver status updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Client-side paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Drivers"
        description="Manage your driver database and safety profiles."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSendReminders}
              disabled={sendingReminders || loading}
              variant="outline"
              className="h-9 px-4 border border-border shadow-sm flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              title="Run manual scanner for driver license expirations"
            >
              {sendingReminders ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Send Reminders
            </Button>
            <Button
              onClick={() => {
                setEditDriver(null);
                setModalOpen(true);
              }}
              className="bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-md h-9 px-4 border border-border shadow-sm flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <Plus className="size-4 stroke-[3]" /> Add Driver
            </Button>
          </div>
        }
      />

      {/* Error alert */}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load drivers</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full max-w-md sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            placeholder="Search name or license..."
            className="pl-9 h-9 bg-card border-border placeholder:text-muted-foreground text-foreground rounded-md w-full focus-visible:ring-1"
          />
        </div>
        
        <Select
          value={filters.status}
          onValueChange={(val) => setFilter("status", val)}
        >
          <SelectTrigger className="h-9 w-[180px] bg-card border-border text-foreground rounded-md">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="h-9 w-9 bg-card border-border hover:bg-muted text-foreground rounded-md">
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      {/* Table Container Card */}
      <div className="border border-border bg-card rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 border-b border-border">
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">DRIVER</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">LICENSE NO</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">CATEGORY</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">EXPIRY</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">CONTACT</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">TRIP COMPL.</TableHead>
                <TableHead className="text-center font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">SAFETY</TableHead>
                <TableHead className="text-left font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">STATUS</TableHead>
                <TableHead className="text-right font-semibold text-xs tracking-wider text-muted-foreground h-10 px-4 py-3 uppercase">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Loading drivers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No drivers found. Register a driver to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((driver) => {
                  const expiryDate = new Date(driver.licenseExpiry);
                  const expired = isPast(expiryDate);
                  
                  let safetyColor = "border-success/30 text-success bg-success/5";
                  if (driver.safetyScore >= 80 && driver.safetyScore < 90) {
                    safetyColor = "border-warning/30 text-warning bg-warning/5";
                  } else if (driver.safetyScore < 80) {
                    safetyColor = "border-destructive/30 text-destructive bg-destructive/5";
                  }

                  let badgeStyle = "border-muted-foreground/30 bg-muted/20 text-muted-foreground";
                  let statusLabel = "OFF DUTY";
                  if (driver.status === "AVAILABLE") {
                    badgeStyle = "border-success/30 bg-success/10 text-success";
                    statusLabel = "AVAILABLE";
                  } else if (driver.status === "ON_TRIP") {
                    badgeStyle = "border-primary/30 bg-primary/10 text-primary";
                    statusLabel = "ON TRIP";
                  } else if (driver.status === "SUSPENDED") {
                    badgeStyle = "border-warning/30 bg-warning/10 text-warning";
                    statusLabel = "SUSPENDED";
                  }

                  return (
                    <TableRow
                      key={driver.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-muted/30 cursor-pointer",
                        selectedDriverId === driver.id && "bg-muted/40"
                      )}
                      onClick={() => setSelectedDriverId(driver.id)}
                    >
                      <TableCell className="px-4 py-3.5 font-bold text-foreground">
                        {driver.name}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-sm text-muted-foreground/80">
                        {driver.licenseNo}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-sm text-muted-foreground/80">
                        {driver.licenseCategory}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        {expired ? (
                          <div className="flex flex-col font-mono text-sm text-destructive italic font-semibold leading-tight">
                            <span>{format(expiryDate, "MM/yyyy")}</span>
                            <span className="text-[10px] font-sans uppercase font-bold tracking-wider">EXPIRED</span>
                          </div>
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground/80">
                            {format(expiryDate, "MM/yyyy")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-sm text-muted-foreground/80">
                        {driver.contact}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-sm text-muted-foreground/80">
                        {driver.tripCompletionRate}%
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <div className="flex justify-center">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full border flex items-center justify-center font-mono font-bold text-xs shadow-sm",
                              safetyColor
                            )}
                          >
                            {driver.safetyScore}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-block font-semibold px-2 py-0.5 text-[10px] border rounded tracking-wide text-center uppercase whitespace-nowrap",
                            badgeStyle
                          )}
                        >
                          {statusLabel}
                        </span>
                      </TableCell>
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
                          <DropdownMenuContent align="end" className="w-36 bg-card border-border">
                            <DropdownMenuLabel className="text-xs">Options</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="text-xs cursor-pointer focus:bg-muted"
                              onClick={() => {
                                setEditDriver(driver);
                                setModalOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              Edit Driver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
              <span className="text-xs font-medium">Loading drivers...</span>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No drivers found.
            </div>
          ) : (
            paginatedItems.map((driver) => {
              const expiryDate = new Date(driver.licenseExpiry);
              const expired = isPast(expiryDate);
              
              let safetyColor = "border-success/30 text-success bg-success/5";
              if (driver.safetyScore >= 80 && driver.safetyScore < 90) {
                safetyColor = "border-warning/30 text-warning bg-warning/5";
              } else if (driver.safetyScore < 80) {
                safetyColor = "border-destructive/30 text-destructive bg-destructive/5";
              }

              let badgeStyle = "border-muted-foreground/30 bg-muted/20 text-muted-foreground";
              let statusLabel = "OFF DUTY";
              if (driver.status === "AVAILABLE") {
                badgeStyle = "border-success/30 bg-success/10 text-success";
                statusLabel = "AVAILABLE";
              } else if (driver.status === "ON_TRIP") {
                badgeStyle = "border-primary/30 bg-primary/10 text-primary";
                statusLabel = "ON TRIP";
              } else if (driver.status === "SUSPENDED") {
                badgeStyle = "border-warning/30 bg-warning/10 text-warning";
                statusLabel = "SUSPENDED";
              }

              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={cn(
                    "p-4 space-y-3 hover:bg-muted/20 cursor-pointer transition-colors",
                    selectedDriverId === driver.id && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground">{driver.name}</div>
                    <span
                      className={cn(
                        "inline-block font-semibold px-2 py-0.5 text-[10px] border rounded tracking-wide text-center uppercase whitespace-nowrap",
                        badgeStyle
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                    <div>License: <span className="text-foreground">{driver.licenseNo}</span></div>
                    <div>Category: <span className="text-foreground">{driver.licenseCategory}</span></div>
                    <div>Contact: <span className="text-foreground">{driver.contact}</span></div>
                    <div>Compl: <span className="text-foreground">{driver.tripCompletionRate}%</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {expired ? (
                        <span className="font-mono text-xs text-destructive italic font-semibold">
                          Expiry: {format(expiryDate, "MM/yyyy")} (EXPIRED)
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          Expiry: {format(expiryDate, "MM/yyyy")}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground font-sans">Safety:</span>
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full border flex items-center justify-center font-mono font-bold text-[11px] shadow-sm",
                            safetyColor
                          )}
                        >
                          {driver.safetyScore}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-card border-border">
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              setEditDriver(driver);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {paginatedItems.length} of {items.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="h-8 bg-card border-border hover:bg-muted text-foreground text-xs px-3 rounded-md"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 bg-card border-border hover:bg-muted text-foreground text-xs px-3 rounded-md"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Status Toggle Panel */}
      <div className="border border-border bg-card p-4 space-y-4 rounded-md shadow-sm">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex flex-wrap items-center gap-1.5">
          <span className="text-foreground">TOGGLE STATUS</span>
          <span className="text-muted-foreground/60">—</span>
          {selectedDriver ? (
            <span className="lowercase text-muted-foreground font-normal">
              select status for <span className="font-semibold text-foreground">{selectedDriver.name}</span> (current: <span className="font-semibold text-foreground uppercase">{selectedDriver.status.replace("_", " ")}</span>)
            </span>
          ) : (
            <span className="lowercase text-muted-foreground font-normal">select a driver from the list above</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("AVAILABLE")}
            className={cn(
              "border h-9 font-semibold text-xs tracking-wider px-6 rounded-md transition-colors uppercase select-none outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedDriver && selectedDriver.status !== "ON_TRIP"
                ? "bg-success/10 hover:bg-success/20 text-success border-success/30 cursor-pointer"
                : "bg-success/5 text-success/40 border-success/10 cursor-not-allowed opacity-50"
            )}
          >
            Available
          </button>
          <button
            disabled={true}
            className={cn(
              "border h-9 font-semibold text-xs tracking-wider px-6 rounded-md transition-colors uppercase select-none outline-none",
              "bg-primary/5 text-primary/40 border-primary/10 cursor-not-allowed opacity-50"
            )}
          >
            On Trip
          </button>
          <button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("OFF_DUTY")}
            className={cn(
              "border h-9 font-semibold text-xs tracking-wider px-6 rounded-md transition-colors uppercase select-none outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedDriver && selectedDriver.status !== "ON_TRIP"
                ? "bg-muted hover:bg-muted/80 text-muted-foreground border-border cursor-pointer"
                : "bg-muted/50 text-muted-foreground/40 border-border/50 cursor-not-allowed opacity-50"
            )}
          >
            Off Duty
          </button>
          <button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("SUSPENDED")}
            className={cn(
              "border h-9 font-semibold text-xs tracking-wider px-6 rounded-md transition-colors uppercase select-none outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedDriver && selectedDriver.status !== "ON_TRIP"
                ? "bg-warning/10 hover:bg-warning/20 text-warning border-warning/30 cursor-pointer"
                : "bg-warning/5 text-warning/40 border-warning/10 cursor-not-allowed opacity-50"
            )}
          >
            Suspended
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 p-3 border border-warning/10 rounded-md">
          <TriangleAlert className="size-4 text-warning shrink-0" />
          <span>Rule: Expired license or Suspended status → blocked from trip assignment</span>
        </div>
      </div>

      <DriverFormModal
        key={editDriver?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        driver={editDriver}
      />
    </div>
  );
}
