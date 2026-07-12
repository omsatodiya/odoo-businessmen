import { useState, type FormEvent } from "react";
import { FormModal } from "@/components/shared/form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompleteTripDialog({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (endOdometer: number, fuelConsumedL?: number, revenue?: number) => Promise<void>;
}) {
  const [endOdometer, setEndOdometer] = useState("");
  const [fuelConsumedL, setFuelConsumedL] = useState("");
  const [revenue, setRevenue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setEndOdometer("");
    setFuelConsumedL("");
    setRevenue("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onComplete(
        Number(endOdometer),
        fuelConsumedL ? Number(fuelConsumedL) : undefined,
        revenue ? Number(revenue) : undefined,
      );
      reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Complete Trip"
      description="Enter the final odometer reading and optional fuel/revenue data."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Complete"
    >
      <div className="space-y-2">
        <Label htmlFor="endOdometer">End Odometer</Label>
        <Input
          id="endOdometer"
          type="number"
          min="0"
          value={endOdometer}
          onChange={(e) => setEndOdometer(e.target.value)}
          placeholder="e.g. 12500"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fuelConsumed">Fuel Consumed (L) — optional</Label>
        <Input
          id="fuelConsumed"
          type="number"
          min="0"
          step="0.1"
          value={fuelConsumedL}
          onChange={(e) => setFuelConsumedL(e.target.value)}
          placeholder="e.g. 32.5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="revenue">Revenue — optional</Label>
        <Input
          id="revenue"
          type="number"
          min="0"
          step="0.01"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          placeholder="e.g. 8500"
        />
      </div>
    </FormModal>
  );
}
