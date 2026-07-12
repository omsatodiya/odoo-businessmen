"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { Vehicle } from "@prisma/client";

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

// Page-level entrance — header, filters, and table fade/slide in as a
// staggered sequence on mount. Kept to mount-only (not re-triggered on
// every refetch) per design.md §7: don't animate on every re-render of
// live data, only meaningful one-time moments.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export function FleetRegistryClient({ isFullAccess }: { isFullAccess: boolean }) {
  const { items, loading, filters, fetch, setFilter, update } = useVehicleStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [retireOpen, setRetireOpen] = useState(false);
  const [vehicleToRetire, setVehicleToRetire] = useState<Vehicle | null>(null);
  const [isRetiring, setIsRetiring] = useState(false);

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
        <span className="font-mono text-xs font-medium uppercase">{vehicle.type}</span>
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
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(vehicle)}
              className="size-7 cursor-pointer"
              title="Edit vehicle details"
            >
              <Edit2 className="size-3.5" />
            </Button>
          </motion.div>
          {vehicle.status !== "RETIRED" && (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRetireClick(vehicle)}
                className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                title="Retire vehicle"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </motion.div>
          )}
        </div>
      ),
    });
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Fleet Registry"
          description="Manage and track your operational transit vehicles."
          actions={
            isFullAccess ? (
              <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
                <Button onClick={handleAdd} className="cursor-pointer">+ Add Vehicle</Button>
              </motion.div>
            ) : undefined
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
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
            <SelectTrigger className="w-[150px] cursor-pointer">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="cursor-pointer">All Types</SelectItem>
              <SelectItem value="VAN" className="cursor-pointer">Van</SelectItem>
              <SelectItem value="TRUCK" className="cursor-pointer">Truck</SelectItem>
              <SelectItem value="MINI" className="cursor-pointer">Mini</SelectItem>
              <SelectItem value="BUS" className="cursor-pointer">Bus</SelectItem>
              <SelectItem value="TRAILER" className="cursor-pointer">Trailer</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) => setFilter("status", val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="w-[150px] cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="cursor-pointer">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE" className="cursor-pointer">Available</SelectItem>
              <SelectItem value="ON_TRIP" className="cursor-pointer">On Trip</SelectItem>
              <SelectItem value="IN_SHOP" className="cursor-pointer">In Shop</SelectItem>
              <SelectItem value="RETIRED" className="cursor-pointer">Retired</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
      </motion.div>

      <motion.div variants={itemVariants} className="border border-border bg-card">
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          emptyMessage="No vehicles registered yet. Register a new vehicle to get started."
          getRowKey={(row) => row.id}
        />
      </motion.div>

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
    </motion.div>
  );
}
