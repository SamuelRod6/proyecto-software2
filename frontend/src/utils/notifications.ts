export type NotificationItem = {
  id: string;
  userId: number;
  message: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "app-notifications";
const UPDATE_EVENT = "notifications:updated";

export function getNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getNotificationsForUser(userId: number): NotificationItem[] {
  return getNotifications().filter((item) => item.userId === userId);
}

export function addUserNotification(userId: number, message: string): void {
  if (typeof window === "undefined") return;
  const next: NotificationItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const current = getNotifications();
  const updated = [next, ...current].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function markAllNotificationsRead(userId: number): void {
  if (typeof window === "undefined") return;
  const current = getNotifications();
  const updated = current.map((item) =>
    item.userId === userId ? { ...item, read: true } : item,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function notificationsUpdatedEvent(): string {
  return UPDATE_EVENT;
}
