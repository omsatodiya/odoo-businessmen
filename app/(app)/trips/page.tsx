"use client";

import { useEffect, useState, type FormEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
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

export default function TripsPage() {
  const { items, options, fetch, fetchOptions, create, dispatch, complete, cancel } =
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
    <div className="flex h-full">
      <div className="w-[42%] shrink-0 overflow-y-auto p-7 pr-0">
        <div className="pr-7">
          <h1 className="text-lg font-bold text-foreground">Trip Lifecycle</h1>

          <div className="relative mt-7">
            <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-border" />
            <motion.div
              className="absolute top-[18px] left-[18px] h-[2px] bg-primary"
              initial={{ width: 0 }}
              animate={{
                width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ maxWidth: `calc(100% - 36px)` }}
            />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const isActive = step.key === "DISPATCHED";
                const isPast = i < activeStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative z-10 flex size-[38px] items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                        isActive
                          ? "border-primary bg-background text-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                          : isPast
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground/60",
                      )}
                    >
                      {isPast ? <Check className="size-4 stroke-[3]" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "mt-2.5 text-xs font-semibold",
                        isActive
                          ? "text-primary"
                          : isPast
                            ? "text-foreground"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Create New Trip</h2>
              <p className="text-xs text-muted-foreground">
                Assign vehicle and driver to start operation.
              </p>
            </div>
            <div className="mt-3 h-px bg-border" />

            <form className="mt-5" onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Source</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="City or location"
                    required
                    className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-0 rounded-lg h-11 px-3.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Destination</Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="City or location"
                    required
                    className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-0 rounded-lg h-11 px-3.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Vehicle</Label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0 focus-visible:border-primary rounded-lg h-11 px-3.5">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground">
                      {options?.vehicles.length === 0 ? (
                        <SelectItem value="-" disabled className="text-muted-foreground/60">
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
                  <Label className="text-xs font-medium text-foreground">Driver</Label>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0 focus-visible:border-primary rounded-lg h-11 px-3.5">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground">
                      {options?.drivers.length === 0 ? (
                        <SelectItem value="-" disabled className="text-muted-foreground/60">
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
                  <Label className="text-xs font-medium text-foreground">Cargo Weight (kg)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={cargoWeightKg}
                    onChange={(e) => setCargoWeightKg(e.target.value)}
                    placeholder="e.g. 450"
                    required
                    className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-0 rounded-lg h-11 px-3.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={plannedDistanceKm}
                    onChange={(e) => setPlannedDistanceKm(e.target.value)}
                    placeholder="e.g. 200"
                    required
                    className="border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-0 rounded-lg h-11 px-3.5"
                  />
                </div>
              </div>

              <AnimatePresence>
                {capacityExceeded && selectedVehicle ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-sm font-medium text-destructive">
                        Capacity exceeded by {excessKg} kg
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        The selected vehicle&apos;s maximum capacity is{" "}
                        {selectedVehicle.capacityKg} kg. Please choose a larger vehicle.
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-6 flex gap-3">
                <Button
                  type="submit"
                  disabled={!formValid || isSubmitting}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold disabled:opacity-40 h-[46px]"
                >
                  {isSubmitting ? "Creating..." : "Create Trip"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-lg px-6 text-sm font-medium h-[46px]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="w-px shrink-0 bg-border" />

      <div className="flex-1 overflow-y-auto p-7 pl-0">
        <div className="pl-7">
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
        </div>
      </div>

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
