import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";

async function checkUrl(url: string | undefined) {
  if (!url) return "not_configured";

  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? "ok" : "degraded";
  } catch {
    return "degraded";
  }
}

export async function GET() {
  let database = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "degraded";
  }

  const [search, logging] = await Promise.all([
    checkUrl(process.env.MEILISEARCH_HOST ? `${process.env.MEILISEARCH_HOST}/health` : undefined),
    checkUrl(process.env.LOKI_PUSH_URL?.replace("/loki/api/v1/push", "/ready")),
  ]);

  const status = database === "ok" && search !== "degraded" && logging !== "degraded" ? "ok" : "degraded";

  return Api.ok({
    status,
    services: {
      database,
      search,
      logging,
    },
  });
}
