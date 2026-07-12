import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  accentClassName,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  /** e.g. "border-l-2 border-l-primary" — use sparingly, not on every card. */
  accentClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("border border-border bg-card p-4", accentClassName, className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value}
        {unit ? <span className="text-lg text-muted-foreground">{unit}</span> : null}
      </p>
    </div>
  );
}
