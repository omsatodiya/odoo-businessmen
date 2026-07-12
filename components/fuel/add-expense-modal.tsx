"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ExpenseType } from "@prisma/client";
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
import { useFuelExpenseStore } from "@/store/fuel-expense-slice";
import { toast } from "sonner";

interface AddExpenseModalProps {
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

export function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
  const createExpense = useFuelExpenseStore((state) => state.createExpense);

  // Fields initialize fresh from props — the parent remounts this component
  // (via a `key` tied to the open state) each time the modal opens, so
  // there's no need to sync/reset via an effect.
  const [vehicles, setVehicles] = useState<OptionVehicle[]>([]);
  const [trips, setTrips] = useState<OptionTrip[]>([]);

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<ExpenseType>("TOLL");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripId, setTripId] = useState("none");
  const [note, setNote] = useState("");

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
    if (!amount || Number(amount) <= 0) newErrors.amount = "Amount must be a positive number";
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
      type,
      amount: Number(amount),
      date: new Date(date),
      tripId: tripId === "none" ? null : tripId,
      note: note.trim() || null,
    };

    try {
      await createExpense(payload);
      toast.success("Expense added successfully");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Expense"
      description="Record an operational expense like toll, parking, or maintenance."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Add Expense"
    >
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="vehicleId" className="h-9">
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.regNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId ? <p className="text-xs text-destructive">{errors.vehicleId}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Expense Type</Label>
            <Select value={type} onValueChange={(val) => setType(val as ExpenseType)}>
              <SelectTrigger id="type" className="h-9">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOLL">Toll</SelectItem>
                <SelectItem value="PARKING">Parking</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="FUEL">Fuel</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150"
              className="h-9 font-mono"
            />
            {errors.amount ? <p className="text-xs text-destructive">{errors.amount}</p> : null}
          </div>

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

        <div className="space-y-1">
          <Label htmlFor="note">Notes (Optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Toll booth payment on NH-48"
            className="min-h-16 text-sm"
          />
        </div>
      </div>
    </FormModal>
  );
}
