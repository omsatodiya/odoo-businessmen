"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveBoardTrip {
  id: string;
  code: string;
  status: string;
  source: string;
  destination: string;
  vehicle: { regNo: string; name: string };
  driver: { name: string };
  createdAt: string | Date;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  COMPLETED: {
    label: "Completed",
    className: "bg-success/10 text-success",
  },
  DISPATCHED: {
    label: "Dispatched",
    className: "bg-primary/10 text-primary",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive",
  },
};

export function LiveBoard({
  trips,
  onDispatch,
  onComplete,
  onCancel,
}: {
  trips: LiveBoardTrip[];
  onDispatch: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const active = trips.filter((t) => t.status !== "CANCELLED");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Live Board</h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-success">
            REAL-TIME SYNC
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground/60">
          No trips yet. Create your first one.
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            <AnimatePresence mode="popLayout">
              {active.map((trip) => {
                const statusStyle = STATUS_STYLES[trip.status] ?? STATUS_STYLES.DRAFT;
                return (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-foreground">{trip.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.driver.name} | {trip.vehicle.name}
                      </p>
                    </div>
                    <div className="mt-1 flex items-start justify-between">
                      <p className="text-sm text-foreground">
                        {trip.source} &rarr; {trip.destination}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          statusStyle.className,
                        )}
                      >
                        {statusStyle.label}
                      </span>
                      <div className="flex gap-1.5">
                        {trip.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDispatch(trip.id)}
                            className="rounded-lg px-3 py-1 text-xs font-medium h-8"
                          >
                            Dispatch
                          </Button>
                        )}
                        {trip.status === "DISPATCHED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onComplete(trip.id)}
                              className="rounded-lg px-3 py-1 text-xs font-medium h-8"
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onCancel(trip.id)}
                              className="rounded-lg px-3 py-1 text-xs font-medium h-8"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {active.length} active trip{active.length !== 1 ? "s" : ""}.
              </p>
              <button
                type="button"
                onClick={() => toast.info("History view coming soon.")}
                className="text-xs font-medium text-primary hover:underline"
              >
                View History
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
