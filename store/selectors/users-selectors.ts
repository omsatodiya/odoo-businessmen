import { SEARCH_FIELD_META } from "@/types/user-query-types";
import type { UsersStore } from "@/store/users-store-types";

export const selectIsSearchPending = (state: UsersStore) =>
  state.searchInput.trim() !== state.appliedSearch.query ||
  state.searchField !== state.appliedSearch.field;

export const selectIsControlsDisabled = (state: UsersStore) =>
  state.isFetching || selectIsSearchPending(state);

export const selectSearchFieldMeta = (state: UsersStore) =>
  SEARCH_FIELD_META[state.searchField];
