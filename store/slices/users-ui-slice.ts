import type { StateCreator } from "zustand";
import { toast } from "sonner";
import { ZodError } from "zod";
import {
  createUser as createUserApi,
  deleteUser as deleteUserApi,
  updateUser as updateUserApi,
} from "@/lib/users-client";
import { DEFAULT_USER_FORM } from "@/types/users-store-types";
import { UserWriteSchema, type UserType } from "@/types/user-types";
import type { UsersStore } from "@/store/users-store-types";

export interface UsersUiSlice {
  isCreateOpen: boolean;
  viewUser: UserType | null;
  editUser: UserType | null;
  deleteUser: UserType | null;
  isSortOpen: boolean;
  isFilterOpen: boolean;
  formData: Partial<UserType>;
  isSubmitting: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openViewModal: (user: UserType) => void;
  closeViewModal: () => void;
  openEditModal: (user: UserType) => void;
  closeEditModal: () => void;
  openDeleteModal: (user: UserType) => void;
  closeDeleteModal: () => void;
  setSortModalOpen: (open: boolean) => void;
  setFilterModalOpen: (open: boolean) => void;
  setFormData: (data: Partial<UserType>) => void;
  createUser: () => Promise<void>;
  updateUser: () => Promise<void>;
  removeUser: () => Promise<void>;
}

function getValidationMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Validation failed";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}

function parseFormPayload(formData: Partial<UserType>) {
  return UserWriteSchema.parse(formData);
}

export const createUsersUiSlice: StateCreator<UsersStore, [], [], UsersUiSlice> = (
  set,
  get
) => ({
  isCreateOpen: false,
  viewUser: null,
  editUser: null,
  deleteUser: null,
  isSortOpen: false,
  isFilterOpen: false,
  formData: { ...DEFAULT_USER_FORM },
  isSubmitting: false,

  openCreateModal: () =>
    set({
      isCreateOpen: true,
      formData: { ...DEFAULT_USER_FORM },
    }),

  closeCreateModal: () => set({ isCreateOpen: false }),

  openViewModal: (user) => set({ viewUser: user }),

  closeViewModal: () => set({ viewUser: null }),

  openEditModal: (user) =>
    set({
      editUser: user,
      formData: {
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        gender: user.gender,
      },
    }),

  closeEditModal: () =>
    set({
      editUser: null,
      formData: { ...DEFAULT_USER_FORM },
    }),

  openDeleteModal: (user) => set({ deleteUser: user }),

  closeDeleteModal: () => set({ deleteUser: null }),

  setSortModalOpen: (open) => set({ isSortOpen: open }),

  setFilterModalOpen: (open) => set({ isFilterOpen: open }),

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  createUser: async () => {
    set({ isSubmitting: true });

    try {
      const payload = parseFormPayload(get().formData);
      await createUserApi(payload);
      toast.success("User created successfully");
      set({ isCreateOpen: false, formData: { ...DEFAULT_USER_FORM } });
      await get().refreshUsers();
    } catch (error) {
      toast.error(getValidationMessage(error));
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateUser: async () => {
    const editUser = get().editUser;
    if (!editUser?.id) return;

    set({ isSubmitting: true });

    try {
      const payload = parseFormPayload(get().formData);
      await updateUserApi(editUser.id, payload);
      toast.success("User updated successfully");
      set({ editUser: null, formData: { ...DEFAULT_USER_FORM } });
      await get().refreshUsers();
    } catch (error) {
      toast.error(getValidationMessage(error));
    } finally {
      set({ isSubmitting: false });
    }
  },

  removeUser: async () => {
    const deleteUserTarget = get().deleteUser;
    if (!deleteUserTarget?.id) return;

    set({ isSubmitting: true });

    try {
      await deleteUserApi(deleteUserTarget.id);
      toast.success("User deleted successfully");
      set({ deleteUser: null });
      await get().refreshUsers();
    } catch (error) {
      toast.error(getValidationMessage(error));
    } finally {
      set({ isSubmitting: false });
    }
  },
});
