"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Driver } from "@prisma/client";
import { LicenseCategory, DriverStatus } from "@prisma/client";

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
import { useDriverStore } from "@/store/driver-slice";
import { toast } from "sonner";

interface DriverFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver | null;
}

export function DriverFormModal({ open, onOpenChange, driver }: DriverFormModalProps) {
  const createDriver = useDriverStore((state) => state.create);
  const updateDriver = useDriverStore((state) => state.update);

  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>("LMV");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [contact, setContact] = useState("");
  const [safetyScore, setSafetyScore] = useState(100);
  const [status, setStatus] = useState<DriverStatus>("AVAILABLE");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setLicenseNo(driver.licenseNo);
      setLicenseCategory(driver.licenseCategory);
      setLicenseExpiry(new Date(driver.licenseExpiry).toISOString().split("T")[0]);
      setContact(driver.contact);
      setSafetyScore(driver.safetyScore);
      setStatus(driver.status);
    } else {
      setName("");
      setLicenseNo("");
      setLicenseCategory("LMV");
      setLicenseExpiry("");
      setContact("");
      setSafetyScore(100);
      setStatus("AVAILABLE");
    }
    setErrors({});
  }, [driver, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!licenseNo.trim()) newErrors.licenseNo = "License number is required";
    if (!licenseExpiry) newErrors.licenseExpiry = "License expiry date is required";
    if (!contact.trim()) newErrors.contact = "Contact is required";
    if (safetyScore < 0 || safetyScore > 100) newErrors.safetyScore = "Safety score must be between 0 and 100";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      licenseNo: licenseNo.trim(),
      licenseCategory,
      licenseExpiry: new Date(licenseExpiry),
      contact: contact.trim(),
      safetyScore: Number(safetyScore),
      status,
    };

    try {
      if (driver) {
        await updateDriver(driver.id, payload);
        toast.success("Driver updated successfully");
      } else {
        await createDriver(payload);
        toast.success("Driver registered successfully");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={driver ? "Edit Driver" : "Add Driver"}
      description={driver ? "Update driver's credentials and status." : "Register a new driver."}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={driver ? "Save Changes" : "Register"}
    >
      <div className="grid gap-3">
        <div className="space-y-1">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="h-9"
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="licenseNo">License Number</Label>
            <Input
              id="licenseNo"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="e.g. DL-88213"
              className="h-9"
            />
            {errors.licenseNo ? <p className="text-xs text-destructive">{errors.licenseNo}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="licenseCategory">Category</Label>
            <Select
              value={licenseCategory}
              onValueChange={(val) => setLicenseCategory(val as LicenseCategory)}
            >
              <SelectTrigger id="licenseCategory" className="h-9">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LMV">LMV (Light Motor)</SelectItem>
                <SelectItem value="HMV">HMV (Heavy Motor)</SelectItem>
                <SelectItem value="MCWG">MCWG (Motorcycle)</SelectItem>
                <SelectItem value="TRANS">TRANS (Transport)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="licenseExpiry">Expiry Date</Label>
            <Input
              id="licenseExpiry"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              className="h-9"
            />
            {errors.licenseExpiry ? <p className="text-xs text-destructive">{errors.licenseExpiry}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="safetyScore">Safety Score (0-100)</Label>
            <Input
              id="safetyScore"
              type="number"
              min="0"
              max="100"
              value={safetyScore}
              onChange={(e) => setSafetyScore(Number(e.target.value))}
              className="h-9 font-mono"
            />
            {errors.safetyScore ? <p className="text-xs text-destructive">{errors.safetyScore}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. 9876543210"
              className="h-9"
            />
            {errors.contact ? <p className="text-xs text-destructive">{errors.contact}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as DriverStatus)}
            >
              <SelectTrigger id="status" className="h-9">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                {/* ON_TRIP option is disabled or only visible if already set */}
                <SelectItem value="ON_TRIP" disabled={driver?.status !== "ON_TRIP"}>
                  On Trip
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
