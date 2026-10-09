import type { Announcement } from "../types";

const STORAGE_KEY = "ia_announcements";

// Initial mock announcements for demo purposes
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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
      return defaultAnnouncements;
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      return [];
    }
  },

  getPublished: async (): Promise<Announcement[]> => {
    const all = await announcementService.getAll();
    return all.filter((a) => a.status === "published").sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  create: async (announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement> => {
    const all = await announcementService.getAll();
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newAnnouncement, ...all]));
    return newAnnouncement;
  },

  update: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    const all = await announcementService.getAll();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Announcement not found");

    const updated = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const all = await announcementService.getAll();
    const filtered = all.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
