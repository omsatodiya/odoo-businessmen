import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can, getRbacMatrix } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceLogTable } from "@/components/maintenance/maintenance-log-table";

export default async function MaintenancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const matrix = await getRbacMatrix();

  // Ensure role has at least VIEW access to FLEET resource
  if (!can(matrix, session.role, "FLEET", "VIEW")) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h1 className="text-xl font-semibold text-destructive">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view the Maintenance logs.
        </p>
      </div>
    );
  }

  const isFullAccess = can(matrix, session.role, "FLEET", "FULL");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Maintenance"
        description="Track and manage vehicle service history and shop status."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isFullAccess ? (
          <>
            <div className="lg:col-span-1">
              <MaintenanceForm />
            </div>
            <div className="lg:col-span-2">
              <MaintenanceLogTable isFullAccess={isFullAccess} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-3">
            <MaintenanceLogTable isFullAccess={isFullAccess} />
          </div>
        )}
      </div>
    </div>
  );
}
