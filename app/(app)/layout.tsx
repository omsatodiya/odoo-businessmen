import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={session} />
        <main className="flex-1 overflow-x-hidden bg-muted/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
