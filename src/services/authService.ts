import { mockUsers } from "../data/mockUsers";
import type { User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "https://araifinalrenderbackendupload.onrender.com";
const MOCK_MODE = false;

const SESSION_KEY = "ia2_session";

function getUserRole(email: string): "admin" | "participant" {
  const normalized = (email || "").trim().toLowerCase();
  const adminEmails = ["contact11induskiller@gmail.com", "aravindmuthiah23@gmail.com"];
  return adminEmails.some(admin => admin.trim().toLowerCase() === normalized) ? "admin" : "participant";
}

function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = authService.getCurrentUser();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (user?.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }

  return data;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      const role = getUserRole(email);
      if (role === "admin") {
        if (email.trim().toLowerCase() === "contact11induskiller@gmail.com".toLowerCase() && password !== "admin123") {
          throw new Error("Invalid email or password.");
        }
      }
      const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        const genericUser: User = {
          id: `user_${Date.now()}`,
          name: email.split("@")[0],
          email,
          phone: "9876543210",
          college: "Demo College",
          course: "B.Tech",
          year: "3rd Year",
          city: "Test City",
          state: "Test State",
          country: "India",
          profileCompleted: true,
          paymentStatus: "pending",
          teamId: null,
          role: getUserRole(email),
          createdAt: new Date().toISOString(),
        };
        saveSession(genericUser);
        return genericUser;
      }
      if (!found.role || found.role !== getUserRole(found.email)) {
        found.role = getUserRole(found.email);
      }
      saveSession(found);
      return found;
    }

    const data = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const user: User = {
      ...data.data.user,
      token: data.data.token,
      role: getUserRole(data.data.user.email),
    };
    saveSession(user);
    return user;
  },

  async register(userData: Partial<User> & { password: string }): Promise<User> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        college: userData.college || "",
        course: userData.course || "",
        year: userData.year || "",
        city: userData.city || "",
        state: userData.state || "",
        country: userData.country || "India",
        profileCompleted: false,
        paymentStatus: "pending",
        teamId: null,
        role: "participant",
        createdAt: new Date().toISOString(),
        linkedin: userData.linkedin,
        github: userData.github,
      };
      saveSession(newUser);
      return newUser;
    }

    const data = await fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...userData, acceptTerms: true }),
    });
    const user: User = {
      ...data.data.user,
      token: data.data.token,
      role: "participant",
    };
    saveSession(user);
    return user;
  },

  async logout(): Promise<void> {
    await fetchWithAuth("/api/auth/logout", { method: "POST" });
    clearSession();
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem("ia2_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async sendOTP(_phone: string): Promise<void> {
    await fetchWithAuth("/api/auth/send-otp", { method: "POST", body: JSON.stringify({ phone: _phone }) });
  },

  async resetPassword(_email: string): Promise<void> {
    await fetchWithAuth("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email: _email }) });
  },

  updateCurrentUser(updates: Partial<User>): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    localStorage.setItem("ia2_session", JSON.stringify(updated));
    return updated;
  },
};