"use client";

import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import { Edit2, Trash2 } from "lucide-react";
import { Vehicle } from "@prisma/client";

import { can } from "@/lib/rbac";
import { useVehicleStore } from "@/store/vehicle-slice";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, FilterSearchInput } from "@/components/shared/filter-bar";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleFormModal } from "@/components/fleet/vehicle-form-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function FleetRegistryClient({ role }: { role: Role }) {
  const { items, loading, filters, fetch, setFilter, update } = useVehicleStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [retireOpen, setRetireOpen] = useState(false);
  const [vehicleToRetire, setVehicleToRetire] = useState<Vehicle | null>(null);
  const [isRetiring, setIsRetiring] = useState(false);

  const isFullAccess = can(role, "FLEET", "FULL");

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleRetireClick = (vehicle: Vehicle) => {
    setVehicleToRetire(vehicle);
    setRetireOpen(true);
  };

  const handleConfirmRetire = async () => {
    if (!vehicleToRetire) return;
    setIsRetiring(true);
    try {
      await update(vehicleToRetire.id, { status: "RETIRED" });
      toast.success(`Vehicle ${vehicleToRetire.regNo} retired successfully`);
      setRetireOpen(false);
    } catch {
      toast.error("Failed to retire vehicle");
    } finally {
      setIsRetiring(false);
      setVehicleToRetire(null);
    }
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      header: "Reg No",
      accessorKey: "regNo",
      className: "font-semibold tracking-wider",
    },
    {
      header: "Name / Model",
      accessorKey: "name",
    },
    {
      header: "Type",
      cell: (vehicle) => (
        <span className="text-xs uppercase font-medium">{vehicle.type}</span>
      ),
    },
    {
      header: "Capacity (Kg)",
      cell: (vehicle) => (
        <span className="font-mono tabular-nums text-sm">
          {vehicle.capacityKg.toLocaleString()} kg
        </span>
      ),
      className: "text-right",
    },
    {
      header: "Odometer (Km)",
      cell: (vehicle) => (
        <span className="font-mono tabular-nums text-sm">
          {vehicle.odometer.toLocaleString()} km
        </span>
      ),
      className: "text-right",
    },
    {
      header: "Acquisition Cost",
      cell: (vehicle) => {
        const formatted = Number(vehicle.acquisitionCost).toLocaleString("en-IN", {
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
      header: "Region",
      cell: (vehicle) => <span>{vehicle.region || "—"}</span>,
    },
    {
      header: "Status",
      cell: (vehicle) => <StatusBadge status={vehicle.status} />,
    },
  ];

  // If full access, add actions column
  if (isFullAccess) {
    columns.push({
      header: "Actions",
      className: "text-right w-24",
      cell: (vehicle) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(vehicle)}
            className="size-7"
            title="Edit vehicle details"
          >
            <Edit2 className="size-3.5" />
          </Button>
          {vehicle.status !== "RETIRED" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRetireClick(vehicle)}
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Retire vehicle"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Registry"
        description="Manage and track your operational transit vehicles."
        actions={
          isFullAccess ? (
            <Button onClick={handleAdd}>+ Add Vehicle</Button>
          ) : undefined
        }
      />

      <FilterBar>
        <FilterSearchInput
          value={filters.q}
          onChange={(val) => setFilter("q", val)}
          placeholder="Search reg no, model..."
        />

        <Select
          value={filters.type || "ALL"}
          onValueChange={(val) => setFilter("type", val === "ALL" ? "" : val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="VAN">Van</SelectItem>
            <SelectItem value="TRUCK">Truck</SelectItem>
            <SelectItem value="MINI">Mini</SelectItem>
            <SelectItem value="BUS">Bus</SelectItem>
            <SelectItem value="TRAILER">Trailer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "ALL"}
          onValueChange={(val) => setFilter("status", val === "ALL" ? "" : val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="IN_SHOP">In Shop</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <div className="border border-border bg-card">
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          emptyMessage="No vehicles registered yet. Register a new vehicle to get started."
          getRowKey={(row) => row.id}
        />
      </div>

      <VehicleFormModal
        key={formOpen ? (editingVehicle?.id || "new") : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editingVehicle}
      />

      <ConfirmDialog
        open={retireOpen}
        onOpenChange={setRetireOpen}
        title="Retire Vehicle"
        description={
          vehicleToRetire
            ? `Are you sure you want to retire vehicle ${vehicleToRetire.regNo}? This action cannot be undone, and the vehicle will be removed from future trip dispatches.`
            : ""
        }
        confirmLabel="Retire Vehicle"
        onConfirm={handleConfirmRetire}
        isLoading={isRetiring}
      />
    </div>
  );
}
