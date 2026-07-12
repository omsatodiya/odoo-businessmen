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
    className: "bg-[rgba(34,197,94,0.12)] text-[#22C55E]",
  },
  DISPATCHED: {
    label: "Dispatched",
    className: "bg-[rgba(61,90,254,0.12)] text-[#3D5AFE]",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-[rgba(255,255,255,0.06)] text-[#A0A0AA]",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-[rgba(239,68,68,0.12)] text-[#EF4444]",
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
        <h2 className="text-base font-bold text-[#F2F2F5]">Live Board</h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#22C55E]" />
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-[#22C55E]">
            REAL-TIME SYNC
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <p className="mt-6 text-sm text-[#5C5C66]">
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
                    className="rounded-xl border border-[#26262F] bg-[#15151C] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-[#F2F2F5]">{trip.code}</p>
                      <p className="text-xs text-[#8A8A96]">
                        {trip.driver.name} | {trip.vehicle.name}
                      </p>
                    </div>
                    <div className="mt-1 flex items-start justify-between">
                      <p className="text-sm text-[#F2F2F5]">
                        {trip.source} &rarr; {trip.destination}
                      </p>
                      <p className="text-xs text-[#5C5C66]">
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
                            onClick={() => onDispatch(trip.id)}
                            className="rounded-lg border border-[#26262F] bg-[#1C1C24] px-3 py-1 text-xs font-medium text-[#F2F2F5] hover:bg-[#26262F] h-8"
                          >
                            Dispatch
                          </Button>
                        )}
                        {trip.status === "DISPATCHED" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onComplete(trip.id)}
                              className="rounded-lg border border-[#26262F] bg-[#1C1C24] px-3 py-1 text-xs font-medium text-[#F2F2F5] hover:bg-[#26262F] h-8"
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

          <div className="mt-5 border-t border-[#26262F] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8A8A96]">
                Showing {active.length} active trip{active.length !== 1 ? "s" : ""}.
              </p>
              <button
                type="button"
                onClick={() => toast.info("History view coming soon.")}
                className="text-xs font-medium text-[#3D5AFE] hover:underline"
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
