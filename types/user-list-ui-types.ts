import type {
  FilterRuleInput,
  SortRuleInput,
  UserFilterableField,
  UserSortableField,
} from "@/types/user-query-types";

export type FilterFieldType = "text" | "select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: UserFilterableField;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
}

export interface SortOption {
  label: string;
  value: UserSortableField;
}

export interface FilterRule extends FilterRuleInput {
  id: string;
}

export interface SortRule extends SortRuleInput {
  id: string;
}
