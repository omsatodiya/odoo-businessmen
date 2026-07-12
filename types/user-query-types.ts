import { z } from "zod";

export const USER_SORTABLE_FIELDS = [
  "createdAt",
  "name",
  "email",
  "role",
] as const;

export const USER_FILTERABLE_FIELDS = ["role", "gender"] as const;

export const USER_SEARCHABLE_FIELDS = [
  "all",
  "name",
  "email",
  "location",
  "role",
  "gender",
] as const;

export type UserSortableField = (typeof USER_SORTABLE_FIELDS)[number];
export type UserFilterableField = (typeof USER_FILTERABLE_FIELDS)[number];
export type UserSearchableField = (typeof USER_SEARCHABLE_FIELDS)[number];

export const SEARCH_FIELD_META: Record<
  UserSearchableField,
  { label: string; placeholder: string }
> = {
  all: { label: "All fields", placeholder: "Search name, email, location..." },
  name: { label: "Name", placeholder: "Search by name..." },
  email: { label: "Email", placeholder: "Search by email..." },
  location: { label: "Location", placeholder: "Search by location..." },
  role: { label: "Role", placeholder: "Search by role..." },
  gender: { label: "Gender", placeholder: "Search by gender..." },
};

export const SearchFieldSchema = z.enum(USER_SEARCHABLE_FIELDS);

export type FilterFieldType = "text" | "select";

export const FILTER_FIELD_META: Record<
  UserFilterableField,
  { type: FilterFieldType; label: string }
> = {
  role: { type: "select", label: "User Role" },
  gender: { type: "select", label: "Gender" },
};

export const FilterOperatorSchema = z.enum(["equals", "contains", "not_equals"]);

export const FilterRuleInputSchema = z.object({
  field: z.enum(USER_FILTERABLE_FIELDS),
  operator: FilterOperatorSchema,
  value: z.string().trim().min(1, "Filter value is required"),
});

export const SortRuleInputSchema = z.object({
  sortBy: z.enum(USER_SORTABLE_FIELDS),
  sortOrder: z.enum(["asc", "desc"]),
});

export const FilterRulesPayloadSchema = z.array(FilterRuleInputSchema).max(10);
export const SortRulesPayloadSchema = z.array(SortRuleInputSchema).max(
  USER_SORTABLE_FIELDS.length
);

export type FilterRuleInput = z.infer<typeof FilterRuleInputSchema>;
export type SortRuleInput = z.infer<typeof SortRuleInputSchema>;

export type QueryValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
