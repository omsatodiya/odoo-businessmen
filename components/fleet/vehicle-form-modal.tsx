"use client";

import { useState } from "react";
import { Vehicle } from "@prisma/client";
import { useVehicleStore } from "@/store/vehicle-slice";
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
import { VehicleType, VehicleStatus } from "@prisma/client";
import { toast } from "sonner";
import { CreateVehicleInput } from "@/types/vehicle";

interface VehicleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

export function VehicleFormModal({ open, onOpenChange, vehicle }: VehicleFormModalProps) {
  const { create, update } = useVehicleStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [regNo, setRegNo] = useState(vehicle?.regNo ?? "");
  const [name, setName] = useState(vehicle?.name ?? "");
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? "VAN");
  const [capacityKg, setCapacityKg] = useState(vehicle?.capacityKg?.toString() ?? "");
  const [odometer, setOdometer] = useState(vehicle?.odometer?.toString() ?? "0");
  const [acquisitionCost, setAcquisitionCost] = useState(vehicle?.acquisitionCost?.toString() ?? "");
  const [region, setRegion] = useState(vehicle?.region ?? "");
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? "AVAILABLE");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const payload = {
      regNo,
      name,
      type,
      capacityKg: capacityKg ? parseInt(capacityKg, 10) : undefined,
      odometer: odometer ? parseInt(odometer, 10) : 0,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
      region: region || null,
      status,
    };

    try {
      if (vehicle) {
        await update(vehicle.id, payload);
        toast.success("Vehicle updated successfully");
      } else {
        await create(payload as CreateVehicleInput);
        toast.success("Vehicle registered successfully");
      }
      onOpenChange(false);
    } catch (err) {
      const errorVal = err as { details?: Record<string, { _errors?: string[] }>; message?: string };
      if (errorVal.details) {
        const formErrors: Record<string, string> = {};
        Object.keys(errorVal.details).forEach((key) => {
          const fieldError = errorVal.details?.[key];
          if (key !== "_errors" && fieldError?._errors?.length) {
            formErrors[key] = fieldError._errors[0];
          }
        });
        setErrors(formErrors);
        toast.error("Please correct the validation errors.");
      } else if (errorVal.message) {
        if (errorVal.message.includes("already exists")) {
          setErrors({ regNo: errorVal.message });
        } else {
          toast.error(errorVal.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={vehicle ? "Edit Vehicle" : "Add Vehicle"}
      description={vehicle ? "Update vehicle registration details." : "Register a new vehicle in the fleet."}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={vehicle ? "Save Changes" : "Register"}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="regNo">Registration Number</Label>
          <Input
            id="regNo"
            placeholder="e.g. GJ-14-AX-1234"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            disabled={isSubmitting}
            className="uppercase"
          />
          {errors.regNo && <p className="text-xs text-destructive">{errors.regNo}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="name">Name / Model</Label>
          <Input
            id="name"
            placeholder="e.g. Tata Ace Gold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="type">Vehicle Type</Label>
          <Select
            value={type}
            onValueChange={(val) => setType(val as VehicleType)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="type" className="w-full cursor-pointer">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VAN" className="cursor-pointer">Van</SelectItem>
              <SelectItem value="TRUCK" className="cursor-pointer">Truck</SelectItem>
              <SelectItem value="MINI" className="cursor-pointer">Mini</SelectItem>
              <SelectItem value="BUS" className="cursor-pointer">Bus</SelectItem>
              <SelectItem value="TRAILER" className="cursor-pointer">Trailer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="capacityKg">Cargo Capacity (Kg)</Label>
          <Input
            id="capacityKg"
            type="number"
            placeholder="e.g. 850"
            value={capacityKg}
            onChange={(e) => setCapacityKg(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.capacityKg && <p className="text-xs text-destructive">{errors.capacityKg}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="odometer">Odometer Reading (Km)</Label>
          <Input
            id="odometer"
            type="number"
            placeholder="e.g. 15000"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.odometer && <p className="text-xs text-destructive">{errors.odometer}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
          <Input
            id="acquisitionCost"
            type="number"
            placeholder="e.g. 750000"
            value={acquisitionCost}
            onChange={(e) => setAcquisitionCost(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.acquisitionCost && <p className="text-xs text-destructive">{errors.acquisitionCost}</p>}
        </div>

        <div className="space-y-1 col-span-1 sm:col-span-2">
          <Label htmlFor="region">Operation Region</Label>
          <Input
            id="region"
            placeholder="e.g. Western Zone"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {vehicle && (
          <div className="space-y-1 col-span-1 sm:col-span-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as VehicleStatus)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="status" className="w-full cursor-pointer">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE" className="cursor-pointer">Available</SelectItem>
                <SelectItem value="ON_TRIP" className="cursor-pointer">On Trip</SelectItem>
                <SelectItem value="IN_SHOP" className="cursor-pointer">In Shop</SelectItem>
                <SelectItem value="RETIRED" className="cursor-pointer">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </FormModal>
  );
}
