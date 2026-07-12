import { create } from "zustand";

import type { NotificationItem } from "@/types/notification-types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

interface NotificationState {
  items: NotificationItem[];
  loading: boolean;
  error?: string;
  fetch: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  loading: false,
  error: undefined,
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load notifications");
      }
      set({ items: json.data, loading: false });
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load notifications"), loading: false });
    }
  },
}));
