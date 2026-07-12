"use client";

import { useState, useEffect } from "react";
import { useVehicleStore } from "@/store/vehicle-slice";
import { useMaintenanceStore } from "@/store/maintenance-slice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Wrench, Info, CheckCircle2, ArrowRight } from "lucide-react";

export function MaintenanceForm() {
  const { items: vehicles, fetch: fetchVehicles, loading: vehiclesLoading } = useVehicleStore();
  const { open: openMaintenanceLog, loading: submitting } = useMaintenanceStore();

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const activeVehicles = vehicles.filter((v) => v.status !== "RETIRED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!vehicleId) {
      setErrors((prev) => ({ ...prev, vehicleId: "Vehicle is required" }));
      return;
    }
    if (!type.trim()) {
      setErrors((prev) => ({ ...prev, type: "Service type is required" }));
      return;
    }
    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      setErrors((prev) => ({ ...prev, cost: "Cost must be a non-negative number" }));
      return;
    }

    try {
      await openMaintenanceLog({
        vehicleId,
        type,
        cost: costNum,
        notes: notes || undefined,
      });
      toast.success("Maintenance log opened successfully. Vehicle is now IN_SHOP.");
      // Reset form
      setVehicleId("");
      setType("");
      setCost("");
      setNotes("");
    } catch (err: any) {
      if (err.details) {
        const formErrors: Record<string, string> = {};
        Object.keys(err.details).forEach((key) => {
          const fieldError = err.details?.[key];
          if (key !== "_errors" && fieldError?._errors?.length) {
            formErrors[key] = fieldError._errors[0];
          }
        });
        setErrors(formErrors);
        toast.error("Please correct the validation errors.");
      } else {
        toast.error(err.message || "Failed to open maintenance log");
      }
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Open Maintenance Log</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="vehicleSelect">Select Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId} disabled={submitting}>
            <SelectTrigger id="vehicleSelect" className="w-full">
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
          {errors.vehicleId && (
            <p className="text-xs text-destructive">{errors.vehicleId}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="serviceType">Service Type</Label>
          <Input
            id="serviceType"
            placeholder="e.g. Oil Change, Brake Service"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={submitting}
          />
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type}</p>
          )}
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
            disabled={submitting}
          />
          {errors.cost && (
            <p className="text-xs text-destructive">{errors.cost}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="serviceNotes">Notes (Optional)</Label>
          <Textarea
            id="serviceNotes"
            placeholder="Describe maintenance actions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            rows={3}
          />
          {errors.notes && (
            <p className="text-xs text-destructive">{errors.notes}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={submitting}>
          {submitting ? "Opening..." : "Open Maintenance"}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 justify-center">
          <Info className="size-3.5" />
          <span>In Shop vehicles are removed from the dispatch pool.</span>
        </div>
        
        <div className="flex flex-col gap-2 pt-2.5 border-t border-border/40">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground/60 w-12 text-right">
              Start:
            </span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-chart-2" />
              <span>Available</span>
            </div>
            <ArrowRight className="size-3" />
            <div className="flex items-center gap-1">
              <Wrench className="size-3 text-chart-3" />
              <span>In Shop</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground/60 w-12 text-right">
              Finish:
            </span>
            <div className="flex items-center gap-1">
              <Wrench className="size-3 text-chart-3" />
              <span>In Shop</span>
            </div>
            <ArrowRight className="size-3" />
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-chart-2" />
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
