import type { User } from "@prisma/client";

import type { UserSearchableField } from "@/types/user-query-types";

type MeiliSearchHit = {
  id: string;
};

type MeiliSearchResponse = {
  hits?: MeiliSearchHit[];
  estimatedTotalHits?: number;
};

type MeiliTaskResponse = {
  taskUid?: number;
};

const DEFAULT_USERS_INDEX = "users";

function getHost() {
  return process.env.MEILISEARCH_HOST?.replace(/\/$/, "");
}

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.MEILISEARCH_API_KEY) {
    headers.Authorization = `Bearer ${process.env.MEILISEARCH_API_KEY}`;
  }

  return headers;
}

function usersIndex() {
  return process.env.MEILISEARCH_USERS_INDEX ?? DEFAULT_USERS_INDEX;
}

function toSearchableUser(user: User) {
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

async function meiliFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const host = getHost();
  if (!host) return null;

  const response = await fetch(`${host}${path}`, {
    ...init,
    headers: {
      ...getHeaders(),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function configureUsersSearchIndex() {
  const index = usersIndex();
  await meiliFetch<MeiliTaskResponse>(`/indexes/${index}/settings`, {
    method: "PATCH",
    body: JSON.stringify({
      searchableAttributes: ["name", "email", "location", "role", "gender"],
      filterableAttributes: ["role", "gender"],
      sortableAttributes: ["createdAt", "name", "email", "role"],
      typoTolerance: { enabled: true },
    }),
  });
}

export async function upsertUsersInSearch(users: User[]) {
  if (users.length === 0) return;

  await configureUsersSearchIndex();
  await meiliFetch<MeiliTaskResponse>(`/indexes/${usersIndex()}/documents`, {
    method: "POST",
    body: JSON.stringify(users.map(toSearchableUser)),
  });
}

export async function deleteUserFromSearch(id: string) {
  await meiliFetch<MeiliTaskResponse>(`/indexes/${usersIndex()}/documents/${id}`, {
    method: "DELETE",
  });
}

export async function searchUserIds(
  query: string,
  field: UserSearchableField,
  limit: number
): Promise<string[] | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const attributesToSearchOn =
    field === "all" ? undefined : [field];

  const response = await meiliFetch<MeiliSearchResponse>(`/indexes/${usersIndex()}/search`, {
    method: "POST",
    body: JSON.stringify({
      q: trimmedQuery,
      limit,
      attributesToSearchOn,
      matchingStrategy: "all",
      showRankingScore: true,
    }),
  });

  if (!response?.hits) return null;

  return response.hits.map((hit) => hit.id);
}
