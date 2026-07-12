import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getRbacMatrix } from "@/lib/rbac";
import { getSession } from "@/lib/session";

// The sidebar's visible nav items depend on the live RBAC matrix (editable
// from Settings). Force this layout to always re-render fresh — never
// served from the client-side route cache — so an RBAC edit is reflected
// on the very next navigation, not just after a hard refresh.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const matrix = await getRbacMatrix();

  return (
    <div className="flex min-h-screen">
      <AppSidebar permissions={matrix[session.role]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={session} />
        <main className="flex-1 overflow-x-hidden bg-muted/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
