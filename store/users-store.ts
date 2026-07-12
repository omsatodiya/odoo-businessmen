import { create } from "zustand";
import { createUsersListSlice } from "@/store/slices/users-list-slice";
import { createUsersQuerySlice } from "@/store/slices/users-query-slice";
import { createUsersUiSlice } from "@/store/slices/users-ui-slice";
import type { UsersStore } from "@/store/users-store-types";

export type { UsersStore };

export const useUsersStore = create<UsersStore>()(
  (...args) => ({
    ...createUsersQuerySlice(...args),
    ...createUsersListSlice(...args),
    ...createUsersUiSlice(...args),
  })
);
