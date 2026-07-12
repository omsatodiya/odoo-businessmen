"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar, FilterSearchInput } from "@/components/shared/filter-bar";
import { FormModal } from "@/components/shared/form-modal";
import { useTripStore } from "@/store/trip-slice";
import type { Trip } from "@prisma/client";

const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;

interface TripRow extends Trip {
  vehicle: { regNo: string; name: string };
  driver: { name: string };
}

const columns: ColumnDef<TripRow>[] = [
  { header: "Code", accessorKey: "code", className: "font-mono" },
  { header: "Source", accessorKey: "source" },
  { header: "Destination", accessorKey: "destination" },
  {
    header: "Vehicle",
    cell: (trip) => `${trip.vehicle.name} (${trip.vehicle.regNo})`,
  },
  { header: "Driver", accessorKey: "driver.name" },
  {
    header: "Cargo",
    accessorKey: "cargoWeightKg",
    className: "font-mono tabular-nums",
    cell: (trip) => `${trip.cargoWeightKg} kg`,
  },
  {
    header: "Distance",
    accessorKey: "plannedDistanceKm",
    className: "font-mono tabular-nums",
    cell: (trip) => `${trip.plannedDistanceKm} km`,
  },
  {
    header: "Status",
    cell: (trip) => <StatusBadge status={trip.status} />,
  },
  {
    header: "Actions",
    className: "w-32",
    cell: () => null,
  },
];

export default function TripsPage() {
  const { items, options, loading, filters, fetch, fetchOptions, create, setFilter } = useTripStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [cargoWeightKg, setCargoWeightKg] = useState("");
  const [plannedDistanceKm, setPlannedDistanceKm] = useState("");

  const selectedVehicle = options?.vehicles.find((v) => v.id === selectedVehicleId);
  const cargoKg = Number(cargoWeightKg);
  const capacityExceeded = selectedVehicle && cargoKg > selectedVehicle.capacityKg;
  const excessKg = capacityExceeded ? cargoKg - selectedVehicle.capacityKg : 0;

  useEffect(() => {
    fetch();
    fetchOptions();
  }, [fetch, fetchOptions]);

  function resetForm() {
    setSource("");
    setDestination("");
    setSelectedVehicleId("");
    setSelectedDriverId("");
    setCargoWeightKg("");
    setPlannedDistanceKm("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (capacityExceeded) return;
    setIsSubmitting(true);
    try {
      await create({
        source,
        destination,
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        cargoWeightKg: cargoKg,
        plannedDistanceKm: Number(plannedDistanceKm),
      });
      toast.success("Trip created successfully");
      setCreateOpen(false);
      resetForm();
      fetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSearch = useCallback(
    (value: string) => {
      setFilter("q", value || undefined);
    },
    [setFilter],
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      setFilter("status", value === "ALL" ? undefined : value);
    },
    [setFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetch(), 300);
    return () => clearTimeout(timer);
  }, [filters, fetch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description="Manage dispatch, tracking, and completion of transport trips."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Create Trip
          </Button>
        }
      />

      <FilterBar>
        <Select value={filters.status ?? "ALL"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-36" size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {TRIP_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FilterSearchInput
          value={filters.q ?? ""}
          onChange={handleSearch}
          placeholder="Search trips..."
        />
      </FilterBar>

      <DataTable<TripRow>
        columns={columns}
        data={items as TripRow[]}
        isLoading={loading}
        emptyMessage="No trips yet — create your first one."
        getRowKey={(row) => row.id}
      />

      <FormModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
        title="Create Trip"
        description="Plan a new transport trip."
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel="Create Trip"
      >
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="City or location" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or location" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger id="vehicle">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {options?.vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} ({v.regNo}) — {v.capacityKg} kg
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Driver</Label>
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger id="driver">
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              {options?.drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargoWeight">Cargo Weight (kg)</Label>
          <Input
            id="cargoWeight"
            type="number"
            min="1"
            value={cargoWeightKg}
            onChange={(e) => setCargoWeightKg(e.target.value)}
            placeholder="e.g. 450"
            required
          />
          {capacityExceeded ? (
            <div className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Capacity exceeded by {excessKg} kg — dispatch blocked.
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plannedDistance">Planned Distance (km)</Label>
          <Input
            id="plannedDistance"
            type="number"
            min="1"
            value={plannedDistanceKm}
            onChange={(e) => setPlannedDistanceKm(e.target.value)}
            placeholder="e.g. 200"
            required
          />
        </div>
      </FormModal>
    </div>
  );
}
