import type { UsersListSlice } from "@/store/slices/users-list-slice";
import type { UsersQuerySlice } from "@/store/slices/users-query-slice";
import type { UsersUiSlice } from "@/store/slices/users-ui-slice";

export type UsersStore = UsersQuerySlice & UsersListSlice & UsersUiSlice;
