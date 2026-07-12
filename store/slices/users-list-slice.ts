import type { StateCreator } from "zustand";
import type { TableFetchTrigger } from "@/components/tables/table-fetch-overlay";
import { fetchUsers as fetchUsersApi } from "@/lib/users-client";
import type { UserType } from "@/types/user-types";
import type { UsersStore } from "@/store/users-store-types";

export interface UsersListSlice {
  users: UserType[];
  totalPages: number;
  totalUsers: number;
  searchProvider: "meilisearch" | "postgres" | "none";
  isFetching: boolean;
  fetchTrigger: TableFetchTrigger | null;
  fetchUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

let activeFetchId = 0;

export const createUsersListSlice: StateCreator<
  UsersStore,
  [],
  [],
  UsersListSlice
> = (set, get) => ({
  users: [],
  totalPages: 1,
  totalUsers: 0,
  searchProvider: "none",
  isFetching: true,
  fetchTrigger: null,

  fetchUsers: async () => {
    const fetchId = ++activeFetchId;
    const state = get();
    const trigger = state.pendingFetchTrigger ?? "refresh";

    set({
      isFetching: true,
      fetchTrigger: trigger,
      pendingFetchTrigger: null,
    });

    try {
      const result = await fetchUsersApi({
        page: state.page,
        limit: state.limit,
        appliedSearch: state.appliedSearch,
        sorts: state.sorts.map(({ sortBy, sortOrder }) => ({ sortBy, sortOrder })),
        filters: state.filters.map(({ field, operator, value }) => ({
          field,
          operator,
          value,
        })),
      });

      if (fetchId !== activeFetchId) {
        return;
      }

      set({
        users: result.users,
        totalPages: result.totalPages,
        totalUsers: result.totalUsers,
        searchProvider: result.searchProvider,
      });

      if (get().clampPageToTotal()) {
        return;
      }
    } catch (error) {
      if (fetchId !== activeFetchId) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Failed to load users";
      const { toast } = await import("sonner");
      toast.error(message);
    } finally {
      if (fetchId === activeFetchId) {
        set({ isFetching: false, fetchTrigger: null });
      }
    }
  },

  refreshUsers: async () => {
    set({ pendingFetchTrigger: "refresh" });
    await get().fetchUsers();
  },
});
