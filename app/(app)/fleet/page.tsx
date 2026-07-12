import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can, getRbacMatrix } from "@/lib/rbac";
import { FleetRegistryClient } from "./fleet-registry-client";

export default async function FleetPage() {
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
          You do not have permission to view the Fleet registry.
        </p>
      </div>
    );
  }

  const isFullAccess = can(matrix, session.role, "FLEET", "FULL");

  return <FleetRegistryClient isFullAccess={isFullAccess} />;
}
