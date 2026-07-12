const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MEILI_HOST = process.env.MEILISEARCH_HOST?.replace(/\/$/, "") ?? "http://localhost:7700";
const MEILI_API_KEY = process.env.MEILISEARCH_API_KEY ?? "masterKey";
const MEILI_INDEX = process.env.MEILISEARCH_USERS_INDEX ?? "users";
const BATCH_SIZE = 500;

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MEILI_API_KEY}`,
  };
}

async function meiliRequest(path, options = {}) {
  const response = await fetch(`${MEILI_HOST}${path}`, {
    ...options,
    headers: {
      ...headers(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meilisearch request failed (${response.status}): ${text}`);
  }

  return response.json();
}

function toDocument(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    location: user.location,
    gender: user.gender,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function configureIndex() {
  await meiliRequest(`/indexes/${MEILI_INDEX}/settings`, {
    method: "PATCH",
    body: JSON.stringify({
      searchableAttributes: ["name", "email", "location", "role", "gender"],
      filterableAttributes: ["role", "gender"],
      sortableAttributes: ["createdAt", "name", "email", "role"],
      typoTolerance: { enabled: true },
    }),
  });
}

async function main() {
  await configureIndex();

  let cursor;
  let indexed = 0;

  for (;;) {
    const users = await prisma.user.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
    });

    if (users.length === 0) break;

    await meiliRequest(`/indexes/${MEILI_INDEX}/documents`, {
      method: "POST",
      body: JSON.stringify(users.map(toDocument)),
    });

    indexed += users.length;
    cursor = users[users.length - 1].id;
  }

  console.info(`Indexed ${indexed} users into Meilisearch index "${MEILI_INDEX}".`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
