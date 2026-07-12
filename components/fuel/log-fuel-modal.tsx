"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FormModal } from "@/components/shared/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFuelExpenseStore } from "@/store/fuel-expense-slice";
import { toast } from "sonner";

interface LogFuelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OptionVehicle {
  id: string;
  regNo: string;
  name: string;
}

interface OptionTrip {
  id: string;
  code: string;
  source: string;
  destination: string;
}

export function LogFuelModal({ open, onOpenChange }: LogFuelModalProps) {
  const createFuelLog = useFuelExpenseStore((state) => state.createFuelLog);

  // Fields initialize fresh from props — the parent remounts this component
  // (via a `key` tied to the open state) each time the modal opens, so
  // there's no need to sync/reset via an effect.
  const [vehicles, setVehicles] = useState<OptionVehicle[]>([]);
  const [trips, setTrips] = useState<OptionTrip[]>([]);

  const [vehicleId, setVehicleId] = useState("");
  const [tripId, setTripId] = useState("none");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/fuel-logs/options")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setVehicles(json.data.vehicles || []);
          setTrips(json.data.trips || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load options", err);
        toast.error("Failed to load vehicle/trip options");
      });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleId) newErrors.vehicleId = "Vehicle is required";
    if (!liters || Number(liters) <= 0) newErrors.liters = "Liters must be a positive number";
    if (!cost || Number(cost) <= 0) newErrors.cost = "Cost must be a positive number";
    if (!date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const payload = {
      vehicleId,
      tripId: tripId === "none" ? null : tripId,
      liters: Number(liters),
      cost: Number(cost),
      date: new Date(date),
    };

    try {
      await createFuelLog(payload);
      toast.success("Fuel log added successfully");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save fuel log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Log Fuel"
      description="Record a vehicle refueling transaction."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Log Fuel"
    >
      <div className="grid gap-3">
        <div className="space-y-1">
          <Label htmlFor="vehicleId">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="vehicleId" className="h-9">
              <SelectValue placeholder="Select Vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.regNo} ({v.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicleId ? <p className="text-xs text-destructive">{errors.vehicleId}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="liters">Liters</Label>
            <Input
              id="liters"
              type="number"
              step="any"
              min="0"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              placeholder="e.g. 45"
              className="h-9 font-mono"
            />
            {errors.liters ? <p className="text-xs text-destructive">{errors.liters}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cost">Cost (INR)</Label>
            <Input
              id="cost"
              type="number"
              step="any"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 4200"
              className="h-9 font-mono"
            />
            {errors.cost ? <p className="text-xs text-destructive">{errors.cost}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 font-mono"
            />
            {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tripId">Trip (Optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger id="tripId" className="h-9">
                <SelectValue placeholder="Select Trip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Unlinked</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code} ({t.source} → {t.destination})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
