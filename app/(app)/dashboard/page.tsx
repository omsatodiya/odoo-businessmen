import { getSession } from "@/lib/session";

// Placeholder — replaced by the real KPI dashboard in the Dashboard build phase.
export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {session?.name} ({session?.role}). KPI cards land here next.
      </p>
    </div>
  );
}
