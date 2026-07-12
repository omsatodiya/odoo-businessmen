import type { TableFetchTrigger } from "@/components/tables/table-fetch-overlay";
import type { UserSearchableField } from "@/types/user-query-types";
import type { UserType } from "@/types/user-types";

export type AppliedUserSearch = {
  field: UserSearchableField;
  query: string;
};

export const DEFAULT_USER_FORM: Partial<UserType> = {
  role: "USER",
};

export interface UsersListMeta {
  totalPages: number;
  totalUsers: number;
}

/** Set before query mutations; consumed on the next fetch. */
export type PendingFetchTrigger = TableFetchTrigger | null;
