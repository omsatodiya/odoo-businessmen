import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <NotificationsClient />;
}
