import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

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
      <h2 className="mb-3 text-sm font-semibold">Live Board</h2>
      {active.length === 0 && trips.length > 0 ? (
        <p className="text-sm text-muted-foreground">No active trips.</p>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trips yet. Create your first one.</p>
      ) : (
        <div className="divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {active.map((trip) => (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="py-3 first:pt-0 last:pb-0 overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{trip.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.source} &rarr; {trip.destination}
                    </p>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground">
                      {trip.driver.name} | {trip.vehicle.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <motion.div
                  className="mt-2 flex gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {trip.status === "DRAFT" && (
                    <Button size="sm" variant="outline" onClick={() => onDispatch(trip.id)}>
                      Dispatch
                    </Button>
                  )}
                  {trip.status === "DISPATCHED" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onComplete(trip.id)}>
                        Complete
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onCancel(trip.id)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {active.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {active.length} active trip{active.length !== 1 ? "s" : ""}.
        </p>
      ) : null}
    </div>
  );
}
