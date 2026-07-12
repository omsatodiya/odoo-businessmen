import { Api } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  return Api.ok({ success: true });
}
