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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LiveBoard } from "@/components/trips/live-board";
import { CompleteTripDialog } from "@/components/trips/complete-trip-dialog";
import { useTripStore } from "@/store/trip-slice";
import type { Trip } from "@prisma/client";

const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;

interface TripRow extends Trip {
  vehicle: { regNo: string; name: string };
  driver: { name: string };
}

export default function TripsPage() {
  const { items, options, loading, filters, fetch, fetchOptions, create, dispatch, complete, cancel, setFilter } =
    useTripStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
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

  useEffect(() => {
    const timer = setTimeout(() => fetch(), 300);
    return () => clearTimeout(timer);
  }, [filters, fetch]);

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

  async function handleDispatch(id: string) {
    try {
      await dispatch(id);
      toast.success("Trip dispatched");
      fetch();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleComplete(endOdometer: number, fuelConsumedL?: number, revenue?: number) {
    if (!selectedTripId) return;
    try {
      await complete(selectedTripId, { endOdometer, fuelConsumedL, revenue });
      toast.success("Trip completed");
      setSelectedTripId(null);
      fetch();
    } catch (err) {
      toast.error((err as Error).message);
      throw err;
    }
  }

  async function handleCancel() {
    if (!selectedTripId) return;
    setIsSubmitting(true);
    try {
      await cancel(selectedTripId, "Cancelled by dispatcher");
      toast.success("Trip cancelled");
      setCancelOpen(false);
      setSelectedTripId(null);
      fetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSearch = useCallback(
    (value: string) => setFilter("q", value || undefined),
    [setFilter],
  );

  const handleStatusFilter = useCallback(
    (value: string) => setFilter("status", value === "ALL" ? undefined : value),
    [setFilter],
  );

  const selectedTrip = items.find((t) => t.id === selectedTripId);
  const cancelReason = selectedTrip?.status === "DISPATCHED"
    ? "This will restore the vehicle and driver to Available."
    : "The trip will be discarded.";

  const columns: ColumnDef<TripRow>[] = [
    { header: "Code", accessorKey: "code", className: "font-mono" },
    { header: "Source", accessorKey: "source" },
    { header: "Destination", accessorKey: "destination" },
    {
      header: "Vehicle",
      cell: (trip) => `${trip.vehicle.name} (${trip.vehicle.regNo})`,
    },
    { header: "Driver", cell: (trip) => trip.driver.name },
    {
      header: "Cargo",
      className: "font-mono tabular-nums",
      cell: (trip) => `${trip.cargoWeightKg} kg`,
    },
    {
      header: "Distance",
      className: "font-mono tabular-nums",
      cell: (trip) => `${trip.plannedDistanceKm} km`,
    },
    {
      header: "Status",
      cell: (trip) => <StatusBadge status={trip.status} />,
    },
    {
      header: "",
      className: "w-40",
      cell: (trip) => (
        <div className="flex gap-1">
          {trip.status === "DRAFT" && (
            <Button size="sm" variant="outline" onClick={() => handleDispatch(trip.id)}>
              Dispatch
            </Button>
          )}
          {trip.status === "DISPATCHED" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTripId(trip.id);
                  setCompleteOpen(true);
                }}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedTripId(trip.id);
                  setCancelOpen(true);
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable<TripRow>
            columns={columns}
            data={items as TripRow[]}
            isLoading={loading}
            emptyMessage="No trips yet — create your first one."
            getRowKey={(row) => row.id}
          />
        </div>
        <div className="lg:col-span-1">
          <LiveBoard
            trips={items as TripRow[]}
            onDispatch={handleDispatch}
            onComplete={(id) => {
              setSelectedTripId(id);
              setCompleteOpen(true);
            }}
            onCancel={(id) => {
              setSelectedTripId(id);
              setCancelOpen(true);
            }}
          />
        </div>
      </div>

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

      <CompleteTripDialog
        open={completeOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedTripId(null);
          setCompleteOpen(open);
        }}
        onComplete={handleComplete}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedTripId(null);
          setCancelOpen(open);
        }}
        title="Cancel Trip"
        description={`Are you sure you want to cancel trip ${selectedTrip?.code ?? ""}? ${cancelReason}`}
        confirmLabel="Cancel Trip"
        onConfirm={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  );
}
