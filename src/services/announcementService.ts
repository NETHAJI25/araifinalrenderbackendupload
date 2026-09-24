import type { Announcement } from "../types";
import { authService } from "./authService";

const MOCK_MODE = false;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = authService.getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
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
      return data.data.announcements;
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

    const data = await apiFetch("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(announcement),
    });
    return data.data.announcement;
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

    const data = await apiFetch(`/api/admin/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return data.data.announcement;
  },

  delete: async (id: string): Promise<void> => {
    if (MOCK_MODE) {
      const all = await announcementService.getAll();
      const filtered = all.filter((a) => a.id !== id);
      localStorage.setItem("ia_announcements", JSON.stringify(filtered));
      return;
    }

    await apiFetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
    });
  },
};