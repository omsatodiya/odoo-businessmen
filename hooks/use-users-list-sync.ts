"use client";

import { useEffect } from "react";
import { useUsersStore } from "@/store";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Wires Zustand query state to list fetching (debounced search + dependency sync).
 * Mount once alongside the users table UI.
 */
export function useUsersListSync() {
  const page = useUsersStore((s) => s.page);
  const limit = useUsersStore((s) => s.limit);
  const appliedSearch = useUsersStore((s) => s.appliedSearch);
  const sorts = useUsersStore((s) => s.sorts);
  const filters = useUsersStore((s) => s.filters);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);

  const searchInput = useUsersStore((s) => s.searchInput);
  const searchField = useUsersStore((s) => s.searchField);
  const commitSearch = useUsersStore((s) => s.commitSearch);

  useEffect(() => {
    void fetchUsers();
  }, [page, limit, appliedSearch, sorts, filters, fetchUsers]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      commitSearch();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounce);
  }, [searchInput, searchField, commitSearch]);
}
