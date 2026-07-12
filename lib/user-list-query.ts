import type { Prisma } from "@prisma/client";
import {
  FILTER_FIELD_META,
  FilterRuleInput,
  FilterRulesPayloadSchema,
  QueryValidationResult,
  SortRuleInput,
  SortRulesPayloadSchema,
  USER_FILTERABLE_FIELDS,
  USER_SEARCHABLE_FIELDS,
  USER_SORTABLE_FIELDS,
  UserSearchableField,
  SearchFieldSchema,
} from "@/types/user-query-types";

const MAX_PAGE_SIZE = 100;

function normalizeValue(value: string): string {
  return value.trim();
}

function filterSignature(rule: FilterRuleInput): string {
  return `${rule.field}:${rule.operator}:${normalizeValue(rule.value).toLowerCase()}`;
}

function operatorLabel(operator: FilterRuleInput["operator"]): string {
  switch (operator) {
    case "equals":
      return "equals";
    case "not_equals":
      return "does not equal";
    case "contains":
      return "contains";
  }
}

export function validateFilterRules(
  raw: unknown
): QueryValidationResult<FilterRuleInput[]> {
  const parsed = FilterRulesPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid filter rules";
    return { success: false, error: message };
  }

  const rules = parsed.data;

  if (rules.length === 0) {
    return { success: true, data: [] };
  }

  const signatures = new Set<string>();
  for (const rule of rules) {
    const signature = filterSignature(rule);
    if (signatures.has(signature)) {
      return {
        success: false,
        error: `Duplicate filter: ${FILTER_FIELD_META[rule.field].label} ${operatorLabel(rule.operator)} "${rule.value}"`,
      };
    }
    signatures.add(signature);

    const fieldMeta = FILTER_FIELD_META[rule.field];
    if (fieldMeta.type === "select" && rule.operator === "contains") {
      return {
        success: false,
        error: `"Contains" is not allowed for ${fieldMeta.label}. Use equals or does not equal.`,
      };
    }
  }

  const byField = new Map<string, FilterRuleInput[]>();
  for (const rule of rules) {
    const existing = byField.get(rule.field) ?? [];
    existing.push(rule);
    byField.set(rule.field, existing);
  }

  for (const field of USER_FILTERABLE_FIELDS) {
    const fieldRules = byField.get(field);
    if (!fieldRules?.length) continue;

    const label = FILTER_FIELD_META[field].label;
    const equalsRules = fieldRules.filter((r) => r.operator === "equals");
    const notEqualsRules = fieldRules.filter((r) => r.operator === "not_equals");
    const containsRules = fieldRules.filter((r) => r.operator === "contains");

    if (equalsRules.length > 1) {
      const values = equalsRules.map((r) => normalizeValue(r.value).toLowerCase());
      if (new Set(values).size > 1) {
        return {
          success: false,
          error: `Conflicting filters on ${label}: cannot require multiple different "equals" values.`,
        };
      }
    }

    if (containsRules.length > 1) {
      const values = containsRules.map((r) => normalizeValue(r.value).toLowerCase());
      if (new Set(values).size > 1) {
        return {
          success: false,
          error: `Conflicting filters on ${label}: cannot apply multiple different "contains" values.`,
        };
      }
    }

    for (const equalsRule of equalsRules) {
      const value = normalizeValue(equalsRule.value);
      const conflictingNotEquals = notEqualsRules.find(
        (r) => normalizeValue(r.value).toLowerCase() === value.toLowerCase()
      );
      if (conflictingNotEquals) {
        return {
          success: false,
          error: `Conflicting filters on ${label}: cannot equal and not equal "${value}" at the same time.`,
        };
      }
    }

    for (const containsRule of containsRules) {
      const value = normalizeValue(containsRule.value);
      const conflictingNotEquals = notEqualsRules.find(
        (r) => normalizeValue(r.value).toLowerCase() === value.toLowerCase()
      );
      if (conflictingNotEquals) {
        return {
          success: false,
          error: `Conflicting filters on ${label}: cannot contain and not equal "${value}" at the same time.`,
        };
      }

      const conflictingEquals = equalsRules.find((r) => {
        const eq = normalizeValue(r.value).toLowerCase();
        const needle = value.toLowerCase();
        return eq !== needle && !eq.includes(needle) && !needle.includes(eq);
      });
      if (conflictingEquals) {
        return {
          success: false,
          error: `Conflicting filters on ${label}: "equals" and "contains" cannot be combined with incompatible values.`,
        };
      }
    }
  }

  return { success: true, data: rules };
}

export function validateSortRules(
  raw: unknown
): QueryValidationResult<SortRuleInput[]> {
  const parsed = SortRulesPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid sort rules";
    return { success: false, error: message };
  }

  const rules = parsed.data;

  if (rules.length === 0) {
    return { success: true, data: [] };
  }

  const seenFields = new Map<string, SortRuleInput["sortOrder"]>();

  for (const rule of rules) {
    const existingOrder = seenFields.get(rule.sortBy);
    if (existingOrder !== undefined) {
      if (existingOrder === rule.sortOrder) {
        return {
          success: false,
          error: `Duplicate sort on "${rule.sortBy}". Each column can only be sorted once.`,
        };
      }
      return {
        success: false,
        error: `Conflicting sort on "${rule.sortBy}": cannot sort ascending and descending at the same time.`,
      };
    }
    seenFields.set(rule.sortBy, rule.sortOrder);
  }

  return { success: true, data: rules };
}

export function parseFilterRulesParam(
  filtersParam: string | null
): QueryValidationResult<FilterRuleInput[]> {
  if (!filtersParam) {
    return { success: true, data: [] };
  }

  try {
    const raw = JSON.parse(filtersParam);
    if (!Array.isArray(raw)) {
      return { success: false, error: "Filters must be a JSON array" };
    }
    return validateFilterRules(raw);
  } catch {
    return { success: false, error: "Invalid filters JSON" };
  }
}

export function parseSortRulesParam(
  sortsParam: string | null
): QueryValidationResult<SortRuleInput[]> {
  if (!sortsParam) {
    return { success: true, data: [] };
  }

  try {
    const raw = JSON.parse(sortsParam);
    if (!Array.isArray(raw)) {
      return { success: false, error: "Sorts must be a JSON array" };
    }
    return validateSortRules(raw);
  } catch {
    return { success: false, error: "Invalid sorts JSON" };
  }
}

export function parseSearchParams(
  searchFieldRaw: string | null,
  searchRaw: string | null
): QueryValidationResult<{ field: UserSearchableField; query: string }> {
  const fieldResult = SearchFieldSchema.safeParse(searchFieldRaw ?? "all");
  if (!fieldResult.success) {
    return { success: false, error: "Invalid search field" };
  }

  const query = (searchRaw ?? "").trim();
  if (query.length > 200) {
    return { success: false, error: "Search query is too long" };
  }

  return { success: true, data: { field: fieldResult.data, query } };
}

function buildSearchCondition(
  field: UserSearchableField,
  query: string
): Prisma.UserWhereInput | null {
  if (!query) return null;

  const contains = { contains: query, mode: "insensitive" as const };

  if (field === "all") {
    return {
      OR: [
        { name: contains },
        { email: contains },
        { location: contains },
        { role: contains },
        { gender: contains },
      ],
    };
  }

  return { [field]: contains };
}

export function buildPrismaWhere(
  filters: FilterRuleInput[],
  searchField: UserSearchableField,
  searchQuery: string,
  searchIds?: string[]
): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];

  if (searchIds !== undefined) {
    if (searchIds.length === 0) {
      return { id: { in: [] } };
    }
    and.push({ id: { in: searchIds } });
  }

  const searchCondition = buildSearchCondition(searchField, searchQuery.trim());
  if (searchCondition) {
    and.push(searchCondition);
  }

  for (const filter of filters) {
    const value = normalizeValue(filter.value);
    if (filter.operator === "equals") {
      and.push({ [filter.field]: value });
    } else if (filter.operator === "not_equals") {
      and.push({ [filter.field]: { not: value } });
    } else if (filter.operator === "contains") {
      and.push({
        [filter.field]: { contains: value, mode: "insensitive" },
      });
    }
  }

  return and.length > 0 ? { AND: and } : {};
}

export function buildPrismaOrderBy(
  sorts: SortRuleInput[]
): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
  if (sorts.length === 0) {
    return { createdAt: "desc" };
  }
  return sorts.map((sort) => ({ [sort.sortBy]: sort.sortOrder }));
}

export function parsePaginationParams(
  pageRaw: string | null,
  limitRaw: string | null
): { page: number; limit: number } | { error: string } {
  const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
  const limit = parseInt(limitRaw || "10", 10) || 10;

  if (limit < 1 || limit > MAX_PAGE_SIZE) {
    return { error: `Limit must be between 1 and ${MAX_PAGE_SIZE}` };
  }

  return { page, limit };
}

export { USER_SORTABLE_FIELDS, USER_FILTERABLE_FIELDS, USER_SEARCHABLE_FIELDS };
