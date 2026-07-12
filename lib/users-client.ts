import type { FilterRuleInput, SortRuleInput } from "@/types/user-query-types";
import type { AppliedUserSearch } from "@/types/users-store-types";
import type { UserType, UserWriteInput } from "@/types/user-types";

export interface FetchUsersParams {
  page: number;
  limit: number;
  appliedSearch: AppliedUserSearch;
  sorts: SortRuleInput[];
  filters: FilterRuleInput[];
}

export interface FetchUsersResult {
  users: UserType[];
  totalPages: number;
  totalUsers: number;
  searchProvider: "meilisearch" | "postgres" | "none";
}

type ApiErrorBody = {
  error?: { message?: string };
};

function getErrorMessage(json: ApiErrorBody, fallback: string): string {
  return json.error?.message ?? fallback;
}

function toQueryPayload(params: FetchUsersParams): URLSearchParams {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    searchField: params.appliedSearch.field,
    search: params.appliedSearch.query,
  });

  if (params.sorts.length > 0) {
    searchParams.append("sorts", JSON.stringify(params.sorts));
  }

  if (params.filters.length > 0) {
    searchParams.append("filters", JSON.stringify(params.filters));
  }

  return searchParams;
}

export async function fetchUsers(
  params: FetchUsersParams
): Promise<FetchUsersResult> {
  const res = await fetch(`/api/users?${toQueryPayload(params).toString()}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(json, "Failed to load users"));
  }

  return {
    users: json.data ?? [],
    totalPages: json.meta?.totalPages ?? 1,
    totalUsers: json.meta?.total ?? 0,
    searchProvider: json.meta?.searchProvider ?? "none",
  };
}

export async function createUser(data: UserWriteInput): Promise<UserType> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(json, "Failed to create user"));
  }

  return json.data;
}

export async function updateUser(id: string, data: UserWriteInput): Promise<UserType> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(json, "Failed to update user"));
  }

  return json.data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const text = await res.text();
    if (text) {
      const json = JSON.parse(text) as ApiErrorBody;
      throw new Error(getErrorMessage(json, "Failed to delete user"));
    }
    throw new Error("Failed to delete user");
  }
}
