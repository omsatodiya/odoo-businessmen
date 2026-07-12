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

/**
 * Configure searchable/filterable/sortable attributes for an index.
 * Call once per index (e.g. on seed or first upsert) — safe to call repeatedly.
 */
export async function configureIndex(
  index: string,
  settings: {
    searchableAttributes?: string[];
    filterableAttributes?: string[];
    sortableAttributes?: string[];
  }
) {
  return meiliFetch<MeiliTaskResponse>(`/indexes/${index}/settings`, {
    method: "PATCH",
    body: JSON.stringify({
      typoTolerance: { enabled: true },
      ...settings,
    }),
  });
}

/** Upsert documents into an index. Each document must have an `id` field. */
export async function upsertDocuments<T extends { id: string }>(
  index: string,
  documents: T[]
) {
  if (documents.length === 0) return null;

  return meiliFetch<MeiliTaskResponse>(`/indexes/${index}/documents`, {
    method: "POST",
    body: JSON.stringify(documents),
  });
}

export async function deleteDocument(index: string, id: string) {
  return meiliFetch<MeiliTaskResponse>(`/indexes/${index}/documents/${id}`, {
    method: "DELETE",
  });
}

/**
 * Typo-tolerant search returning matching document ids, or `null` if
 * Meilisearch is unreachable/unconfigured — callers must fall back to a
 * Postgres ILIKE query in that case.
 */
export async function searchIds(
  index: string,
  query: string,
  opts?: { limit?: number; searchableFields?: string[] }
): Promise<string[] | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const response = await meiliFetch<MeiliSearchResponse>(`/indexes/${index}/search`, {
    method: "POST",
    body: JSON.stringify({
      q: trimmedQuery,
      limit: opts?.limit ?? 20,
      attributesToSearchOn: opts?.searchableFields,
      matchingStrategy: "all",
    }),
  });

  if (!response?.hits) return null;

  return response.hits.map((hit) => hit.id);
}
