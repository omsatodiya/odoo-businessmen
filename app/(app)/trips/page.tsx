"use client";

import { useEffect, useState, type FormEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LiveBoard } from "@/components/trips/live-board";
import { CompleteTripDialog } from "@/components/trips/complete-trip-dialog";
import { useTripStore } from "@/store/trip-slice";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "DRAFT", label: "Plan" },
  { key: "DISPATCHED", label: "Dispatch" },
  { key: "COMPLETED", label: "Complete" },
  { key: "CANCELLED", label: "Cancel" },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export default function TripsPage() {
  const { items, options, loading, fetch, fetchOptions, create, dispatch, complete, cancel } =
    useTripStore();

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

  const formValid =
    source &&
    destination &&
    selectedVehicleId &&
    selectedDriverId &&
    cargoKg > 0 &&
    Number(plannedDistanceKm) > 0 &&
    !capacityExceeded;

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

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formValid || capacityExceeded) return;
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
        resetForm();
        fetch();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [source, destination, selectedVehicleId, selectedDriverId, cargoKg, plannedDistanceKm, formValid, capacityExceeded, create, fetch],
  );

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

  const selectedTrip = items.find((t) => t.id === selectedTripId);
  const cancelReason =
    selectedTrip?.status === "DISPATCHED"
      ? "This will restore the vehicle and driver to Available."
      : "The trip will be discarded.";

  const activeStepIndex = STEPS.findIndex((s) => s.key === "DISPATCHED");

  return (
    <motion.div
      className="grid grid-cols-[3fr_2fr] gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-8">
        <motion.div variants={itemVariants}>
          <Label className="text-sm font-semibold text-foreground">Trip Lifecycle</Label>
          <div className="relative mt-4">
            <div className="absolute top-3 left-0 right-0 h-px bg-border" />
            <motion.div
              className="absolute top-3 left-0 h-px bg-primary"
              initial={{ width: 0 }}
              animate={{
                width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const isActive = step.key === "DISPATCHED";
                const isPast = i < activeStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "relative z-10 flex size-6 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isPast
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-card text-muted-foreground",
                      )}
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={
                        isActive
                          ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                          : {}
                      }
                    >
                      {isPast ? "\u2713" : i + 1}
                    </motion.div>
                    <span
                      className={cn(
                        "mt-2 text-xs",
                        isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Label className="text-sm font-semibold text-foreground">Create Trip</Label>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-xs text-muted-foreground">
                Source
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="City or location"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs text-muted-foreground">
                Destination
              </Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City or location"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vehicle" className="text-xs text-muted-foreground">
                Vehicle
              </Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {options?.vehicles.length === 0 ? (
                    <SelectItem value="-" disabled>
                      No available vehicles
                    </SelectItem>
                  ) : (
                    options?.vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.regNo}) &mdash; {v.capacityKg} kg
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="driver" className="text-xs text-muted-foreground">
                Driver
              </Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {options?.drivers.length === 0 ? (
                    <SelectItem value="-" disabled>
                      No available drivers
                    </SelectItem>
                  ) : (
                    options?.drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cargoWeight" className="text-xs text-muted-foreground">
                Cargo Weight (kg)
              </Label>
              <Input
                id="cargoWeight"
                type="number"
                min="1"
                value={cargoWeightKg}
                onChange={(e) => setCargoWeightKg(e.target.value)}
                placeholder="e.g. 450"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plannedDistance" className="text-xs text-muted-foreground">
                Distance (km)
              </Label>
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

            <AnimatePresence>
              {capacityExceeded && selectedVehicle ? (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="border border-destructive/40 bg-destructive/10 p-3">
                    <p className="text-sm font-medium text-destructive">
                      Capacity exceeded by {excessKg} kg
                    </p>
                    <p className="mt-0.5 text-xs text-destructive/80">
                      The selected vehicle&apos;s maximum capacity is {selectedVehicle.capacityKg} kg.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!formValid || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Trip"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        {loading && items.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <LiveBoard
            trips={items}
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
        )}
      </motion.div>

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
    </motion.div>
  );
}
