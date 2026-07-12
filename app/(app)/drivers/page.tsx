"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isPast } from "date-fns";
import { Edit2, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar, FilterSearchInput } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import { toast } from "sonner";

export default function DriversPage() {
  const { items, loading, error, filters, fetch, setFilter, update } = useDriverStore();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverWithCompletion | null>(null);

  // Derived, not synced via effect — always reflects the latest fetch.
  const selectedDriver = useMemo(
    () => items.find((d) => d.id === selectedDriverId) ?? null,
    [items, selectedDriverId]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleStatusToggle = async (status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED") => {
    if (!selectedDriver) return;
    try {
      await update(selectedDriver.id, { status });
      toast.success(`Driver status updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const getSafetyBadgeStyle = (score: number) => {
    if (score >= 90) return "bg-success/15 text-success border border-success/20";
    if (score >= 80) return "bg-warning/15 text-warning border border-warning/20";
    return "bg-destructive/10 text-destructive border border-destructive/20";
  };

  const columns = [
    {
      header: "Driver",
      accessorKey: "name",
      cell: (driver: DriverWithCompletion) => (
        <div
          className={cn(
            "font-medium text-foreground cursor-pointer select-none",
            selectedDriver?.id === driver.id && "text-primary"
          )}
          onClick={() => setSelectedDriverId(driver.id)}
        >
          {driver.name}
        </div>
      ),
    },
    {
      header: "License No",
      accessorKey: "licenseNo",
      className: "font-mono tabular-nums",
      cell: (driver: DriverWithCompletion) => (
        <div
          className={cn("cursor-pointer select-none", selectedDriver?.id === driver.id && "text-primary font-semibold")}
          onClick={() => setSelectedDriverId(driver.id)}
        >
          {driver.licenseNo}
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "licenseCategory",
      className: "font-mono",
      cell: (driver: DriverWithCompletion) => (
        <div className="cursor-pointer select-none" onClick={() => setSelectedDriverId(driver.id)}>
          {driver.licenseCategory}
        </div>
      ),
    },
    {
      header: "Expiry",
      accessorKey: "licenseExpiry",
      cell: (driver: DriverWithCompletion) => {
        const date = new Date(driver.licenseExpiry);
        const expired = isPast(date);
        return (
          <div
            className="cursor-pointer select-none"
            onClick={() => setSelectedDriverId(driver.id)}
          >
            <span
              className={cn(
                "font-mono tabular-nums",
                expired ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {format(date, "MM/yyyy")}
              {expired ? " EXPIRED" : ""}
            </span>
          </div>
        );
      },
    },
    {
      header: "Contact",
      accessorKey: "contact",
      className: "font-mono tabular-nums text-muted-foreground",
      cell: (driver: DriverWithCompletion) => (
        <div className="cursor-pointer select-none" onClick={() => setSelectedDriverId(driver.id)}>
          {driver.contact}
        </div>
      ),
    },
    {
      header: "Trip Compl.",
      accessorKey: "tripCompletionRate",
      className: "font-mono tabular-nums text-right",
      cell: (driver: DriverWithCompletion) => (
        <div className="cursor-pointer select-none" onClick={() => setSelectedDriverId(driver.id)}>
          {driver.tripCompletionRate}%
        </div>
      ),
    },
    {
      header: "Safety",
      accessorKey: "safetyScore",
      className: "text-center",
      cell: (driver: DriverWithCompletion) => (
        <div className="cursor-pointer select-none" onClick={() => setSelectedDriverId(driver.id)}>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono tabular-nums",
              getSafetyBadgeStyle(driver.safetyScore)
            )}
          >
            {driver.safetyScore}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (driver: DriverWithCompletion) => (
        <div className="cursor-pointer select-none" onClick={() => setSelectedDriverId(driver.id)}>
          <StatusBadge status={driver.status} />
        </div>
      ),
    },
    {
      header: "Actions",
      cell: (driver: DriverWithCompletion) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation(); // Avoid selecting row when clicking edit button
            setEditDriver(driver);
            setModalOpen(true);
          }}
        >
          <Edit2 className="size-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage your driver database and safety profiles."
        actions={
          <Button
            onClick={() => {
              setEditDriver(null);
              setModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium"
          >
            + Add Driver
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load drivers</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FilterBar>
        <FilterSearchInput
          value={filters.q}
          onChange={(val) => setFilter("q", val)}
          placeholder="Search name or license..."
        />
        <Select
          value={filters.status}
          onValueChange={(val) => setFilter("status", val)}
        >
          <SelectTrigger className="h-9 w-[180px]">
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
      </FilterBar>

      <div className="border border-border bg-card">
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          emptyMessage="No drivers found. Register a driver to get started."
          getRowKey={(row) => row.id}
        />
        
        {/* Table representation for mobile screens */}
        <div className="block md:hidden divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No drivers found.
            </div>
          ) : (
            items.map((driver) => {
              const expired = isPast(new Date(driver.licenseExpiry));
              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={cn(
                    "p-4 space-y-2 hover:bg-muted/50 cursor-pointer transition-colors",
                    selectedDriver?.id === driver.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-foreground">{driver.name}</div>
                    <StatusBadge status={driver.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground font-mono">
                    <div>License: {driver.licenseNo} ({driver.licenseCategory})</div>
                    <div>Contact: {driver.contact}</div>
                    <div className={expired ? "text-destructive font-semibold" : ""}>
                      Expiry: {format(new Date(driver.licenseExpiry), "MM/yyyy")}
                      {expired ? " EXPIRED" : ""}
                    </div>
                    <div>Compl: {driver.tripCompletionRate}%</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Safety:</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold font-mono",
                          getSafetyBadgeStyle(driver.safetyScore)
                        )}
                      >
                        {driver.safetyScore}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDriver(driver);
                        setModalOpen(true);
                      }}
                    >
                      <Edit2 className="size-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Status Toggle Panel */}
      <div className="border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Toggle Status
            {selectedDriver ? (
              <span className="lowercase font-normal text-muted-foreground">
                {" "}
                for <span className="font-semibold text-foreground">{selectedDriver.name}</span> (Current: {selectedDriver.status})
              </span>
            ) : (
              <span className="lowercase font-normal text-muted-foreground"> — select a driver from the list above</span>
            )}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("AVAILABLE")}
            className="bg-success/10 hover:bg-success/20 text-success border border-success/20 h-9 font-medium"
          >
            Available
          </Button>
          <Button
            disabled={true}
            className="bg-primary/10 text-primary border border-primary/20 h-9 font-medium"
          >
            On Trip
          </Button>
          <Button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("OFF_DUTY")}
            className="bg-muted text-muted-foreground border border-muted-foreground/20 h-9 font-medium"
          >
            Off Duty
          </Button>
          <Button
            disabled={!selectedDriver || selectedDriver.status === "ON_TRIP"}
            onClick={() => handleStatusToggle("SUSPENDED")}
            className="bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 h-9 font-medium"
          >
            Suspended
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 border border-border/40">
          <ShieldAlert className="size-4 text-warning shrink-0" />
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
