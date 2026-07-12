// Lightweight, per-browser read/unread tracking for notifications. Since
// notifications are computed live (not stored rows), "read" state doesn't
// need a database table — it's a client-side preference, scoped to this
// browser. If the underlying condition resolves (e.g. a license gets
// renewed), the notification just stops appearing, which is its own form
// of resolution regardless of read state.
const STORAGE_KEY = "transitops:read-notifications";

function getReadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadSet(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Storage unavailable/full — read state just won't persist, non-fatal.
  }
}

export function isRead(id: string): boolean {
  return getReadSet().has(id);
}

export function markAsRead(id: string): void {
  const set = getReadSet();
  set.add(id);
  saveReadSet(set);
}

export function markAllAsRead(ids: string[]): void {
  const set = getReadSet();
  for (const id of ids) set.add(id);
  saveReadSet(set);
}
