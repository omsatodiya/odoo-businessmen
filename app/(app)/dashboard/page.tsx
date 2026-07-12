import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can, getRbacMatrix } from "@/lib/rbac";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const matrix = await getRbacMatrix();

  // Ensure role has permission to view dashboard
  if (!can(matrix, session.role, "DASHBOARD", "VIEW")) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h1 className="text-xl font-semibold text-destructive">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view the Dashboard.
        </p>
      </div>
    );
  }

  return <DashboardClient />;
}
