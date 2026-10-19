import type { Announcement } from "../types";
import { authService } from "./authService";

const MOCK_MODE = false;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = authService.getToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API_URL} — is the backend running?`);
  }

  const text = await res.text();
  let data: { message?: string; data?: unknown } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body (e.g. a hosting 404/502 page) — fall through to status error
  }
  if (!res.ok) throw new Error(data?.message || `Request failed with status ${res.status}`);
  return data ?? {};
}

// The backend may return rows in either the new shape ({ priority, status })
// or the legacy shape ({ isPublished }) — normalize both to the frontend type.
function normalizeAnnouncement(raw: Partial<Announcement> & { isPublished?: boolean }): Announcement {
  return {
    id: raw.id ?? `a${Date.now()}`,
    title: raw.title ?? "",
    content: raw.content ?? "",
    priority: raw.priority ?? "Normal",
    status: raw.status ?? (raw.isPublished ? "published" : "draft"),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

// Initial mock announcements for demo purposes (fallback only)
const defaultAnnouncements: Announcement[] = [
  {
    id: "a1",
    title: "Welcome to Innovators Arena 2.0!",
    content: "Registration is now open. Form your teams and start building!",
    priority: "Important",
    status: "published",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "a2",
    title: "Problem Statements Released",
    content: "The official problem statements from our sponsors are now available in the dashboard.",
    priority: "Normal",
    status: "published",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  }
];

export const announcementService = {
  getAll: async (): Promise<Announcement[]> => {
    if (MOCK_MODE) {
      try {
        const STORAGE_KEY = "ia_announcements";
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
        return defaultAnnouncements;
      } catch {
        return [];
      }
    }

    try {
      const data = await apiFetch("/api/announcements");
      // Backend returns { success: true, data: announcementsArray }
      return ((data.data as Partial<Announcement>[] | undefined) || []).map(normalizeAnnouncement);
    } catch {
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem("ia_announcements");
        if (stored) return JSON.parse(stored);
      } catch {}
      return defaultAnnouncements;
    }
  },

  getPublished: async (): Promise<Announcement[]> => {
    const all = await announcementService.getAll();
    return all.filter((a) => a.status === "published").sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  create: async (announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement> => {
    if (MOCK_MODE) {
      const all = await announcementService.getAll();
      const newAnnouncement: Announcement = {
        ...announcement,
        id: `a${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ia_announcements", JSON.stringify([newAnnouncement, ...all]));
      return newAnnouncement;
    }

    const data = await apiFetch("/api/announcements", {
      method: "POST",
      body: JSON.stringify({
        ...announcement,
        // Legacy backends only understand the boolean flag, not `status`
        isPublished: announcement.status === "published",
      }),
    });
    return normalizeAnnouncement(data.data as Partial<Announcement>);
  },

  update: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    if (MOCK_MODE) {
      const all = await announcementService.getAll();
      const index = all.findIndex((a) => a.id === id);
      if (index === -1) throw new Error("Announcement not found");
      const updated = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      all[index] = updated;
      localStorage.setItem("ia_announcements", JSON.stringify(all));
      return updated;
    }

    const data = await apiFetch(`/api/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...updates,
        // Legacy backends only understand the boolean flag, not `status`
        ...(updates.status !== undefined
          ? { isPublished: updates.status === "published" }
          : {}),
      }),
    });
    return normalizeAnnouncement(data.data as Partial<Announcement>);
  },

  delete: async (id: string): Promise<void> => {
    if (MOCK_MODE) {
      const all = await announcementService.getAll();
      const filtered = all.filter((a) => a.id !== id);
      localStorage.setItem("ia_announcements", JSON.stringify(filtered));
      return;
    }

    await apiFetch(`/api/announcements/${id}`, {
      method: "DELETE",
    });
  },
};