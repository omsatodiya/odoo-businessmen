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
}

const BORDER_COLORS: Record<string, string> = {
  DRAFT: "border-l-muted-foreground",
  DISPATCHED: "border-l-primary",
  COMPLETED: "border-l-chart-2",
  CANCELLED: "border-l-destructive",
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
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Live Board</h2>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active trips.</p>
      ) : (
        active.map((trip) => (
          <div
            key={trip.id}
            className={`border border-border bg-card p-4 border-l-2 ${BORDER_COLORS[trip.status] ?? "border-l-border"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{trip.code}</span>
              <StatusBadge status={trip.status} />
            </div>
            <p className="mt-2 text-sm">
              {trip.vehicle.name} ({trip.vehicle.regNo})
            </p>
            <p className="text-sm text-muted-foreground">{trip.driver.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {trip.source} → {trip.destination}
            </p>
            <div className="mt-2 flex gap-2">
              {trip.status === "DRAFT" && (
                <Button size="sm" onClick={() => onDispatch(trip.id)}>
                  Dispatch
                </Button>
              )}
              {trip.status === "DISPATCHED" && (
                <>
                  <Button size="sm" onClick={() => onComplete(trip.id)}>
                    Complete
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onCancel(trip.id)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
