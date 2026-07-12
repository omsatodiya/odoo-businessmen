import type { FilterConfig, SortOption } from "@/types/user-list-ui-types";

export const USER_SORT_OPTIONS: SortOption[] = [
  { label: "Created Date", value: "createdAt" },
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
  { label: "Role", value: "role" },
];

export const USER_FILTER_CONFIG: FilterConfig[] = [
  {
    key: "role",
    label: "User Role",
    type: "select",
    options: [
      { label: "Admin", value: "ADMIN" },
      { label: "Manager", value: "MANAGER" },
      { label: "User", value: "USER" },
    ],
  },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Other", value: "Other" },
    ],
  },
];
