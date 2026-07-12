"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useVehicleStore } from "@/store/vehicle-slice";
import { useMaintenanceStore } from "@/store/maintenance-slice";
import { FormModal } from "@/components/shared/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MaintenanceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceFormModal({ open, onOpenChange }: MaintenanceFormModalProps) {
  const { items: vehicles, fetch: fetchVehicles, loading: vehiclesLoading } = useVehicleStore();
  const { open: openMaintenanceLog } = useMaintenanceStore();

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchVehicles();
      // Reset form
      setVehicleId("");
      setType("");
      setCost("");
      setNotes("");
      setErrors({});
    }
  }, [open, fetchVehicles]);

  const activeVehicles = vehicles.filter(
    (v) => v.status !== "IN_SHOP" && v.status !== "RETIRED" && v.status !== "ON_TRIP"
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleId) newErrors.vehicleId = "Vehicle is required";
    if (!type.trim()) newErrors.type = "Service type is required";
    
    const costNum = cost ? parseFloat(cost) : 0;
    if (isNaN(costNum) || costNum < 0) {
      newErrors.cost = "Cost must be a non-negative number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const costNum = cost ? parseFloat(cost) : 0;

    try {
      await openMaintenanceLog({
        vehicleId,
        type: type.trim(),
        cost: costNum,
        notes: notes.trim() || undefined,
      });
      toast.success("Maintenance log opened successfully. Vehicle is now IN_SHOP.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open maintenance log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Open Maintenance Log"
      description="Create a new maintenance entry. The selected vehicle's status will update to IN_SHOP."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Open Maintenance"
    >
      <div className="grid gap-3">
        <div className="space-y-1">
          <Label htmlFor="vehicleSelect">Select Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId} disabled={isSubmitting}>
            <SelectTrigger id="vehicleSelect" className="h-9">
              <SelectValue placeholder="Choose a vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {activeVehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.regNo} — {vehicle.name} ({vehicle.status})
                </SelectItem>
              ))}
              {activeVehicles.length === 0 && !vehiclesLoading && (
                <SelectItem value="none" disabled>
                  No active vehicles available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.vehicleId ? <p className="text-xs text-destructive">{errors.vehicleId}</p> : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="serviceType">Service Type</Label>
          <Input
            id="serviceType"
            placeholder="e.g. Oil Change, Brake Service"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
            className="h-9"
          />
          {errors.type ? <p className="text-xs text-destructive">{errors.type}</p> : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="serviceCost">Estimated Cost (₹)</Label>
          <Input
            id="serviceCost"
            type="number"
            step="0.01"
            placeholder="e.g. 1500"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={isSubmitting}
            className="h-9"
          />
          {errors.cost ? <p className="text-xs text-destructive">{errors.cost}</p> : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="serviceNotes">Notes (Optional)</Label>
          <Textarea
            id="serviceNotes"
            placeholder="Describe maintenance actions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>
      </div>
    </FormModal>
  );
}
