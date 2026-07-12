import type { StateCreator } from "zustand";
import type { FilterRule, SortRule } from "@/types/user-list-ui-types";
import type { UserSearchableField } from "@/types/user-query-types";
import type {
  AppliedUserSearch,
  PendingFetchTrigger,
} from "@/types/users-store-types";
import type { UsersStore } from "@/store/users-store-types";

export interface UsersQuerySlice {
  searchInput: string;
  searchField: UserSearchableField;
  appliedSearch: AppliedUserSearch;
  page: number;
  limit: number;
  sorts: SortRule[];
  filters: FilterRule[];
  pendingFetchTrigger: PendingFetchTrigger;
  setSearchInput: (value: string) => void;
  setSearchField: (field: UserSearchableField) => void;
  commitSearch: () => void;
  applySorts: (sorts: SortRule[]) => void;
  applyFilters: (filters: FilterRule[]) => void;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
  clampPageToTotal: () => boolean;
}

const defaultAppliedSearch: AppliedUserSearch = {
  field: "all",
  query: "",
};

export const createUsersQuerySlice: StateCreator<
  UsersStore,
  [],
  [],
  UsersQuerySlice
> = (set) => ({
  searchInput: "",
  searchField: "all",
  appliedSearch: defaultAppliedSearch,
  page: 1,
  limit: 10,
  sorts: [],
  filters: [],
  pendingFetchTrigger: "initial",

  setSearchInput: (value) => set({ searchInput: value }),

  setSearchField: (field) => set({ searchField: field }),

  commitSearch: () =>
    set((state) => {
      const query = state.searchInput.trim();
      if (
        state.appliedSearch.field === state.searchField &&
        state.appliedSearch.query === query
      ) {
        return {};
      }
      return {
        appliedSearch: { field: state.searchField, query },
        page: 1,
        pendingFetchTrigger: "search",
      };
    }),

  applySorts: (sorts) =>
    set({
      sorts,
      page: 1,
      pendingFetchTrigger: "sort",
    }),

  applyFilters: (filters) =>
    set({
      filters,
      page: 1,
      pendingFetchTrigger: "filter",
    }),

  handlePageChange: (page) =>
    set({
      page,
      pendingFetchTrigger: "pagination",
    }),

  handleLimitChange: (limit) =>
    set({
      limit,
      page: 1,
      pendingFetchTrigger: "limit",
    }),

  clampPageToTotal: () => {
    let didClamp = false;
    set((state) => {
      if (state.totalPages > 0 && state.page > state.totalPages) {
        didClamp = true;
        return {
          page: state.totalPages,
          pendingFetchTrigger: "pagination",
        };
      }
      return {};
    });
    return didClamp;
  },
});
