import { mockUsers } from "../data/mockUsers";
import type { User } from "../types";
import { eventConfig } from "../config/eventConfig";

const MOCK_MODE = false;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSION_KEY = "ia2_session";
const TOKEN_KEY = "ia2_token";

function getUserRole(email: string): "admin" | "participant" {
  const normalized = (email || "").trim().toLowerCase();
  const isAdmin = eventConfig.adminEmails.some(
    (admin) => admin.trim().toLowerCase() === normalized
  );
  return isAdmin ? "admin" : "participant";
}

function saveSession(user: User, token?: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Parse a response body safely (Render cold starts can return non-JSON errors).
async function parseBody(res: Response): Promise<{ message?: string; data?: unknown } | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data?.message || `Login failed (${res.status}). Please try again.`);
    const loggedInUser = { ...(data!.data as { user: User }).user, role: getUserRole((data!.data as { user: User }).user.email) };
    saveSession(loggedInUser, (data!.data as { token: string }).token);
    return loggedInUser;
  },

  async register(data: Partial<User> & { password: string }): Promise<User> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        college: data.college || "",
        course: data.course || "",
        year: data.year || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "India",
        profileCompleted: false,
        paymentStatus: "pending",
        teamId: null,
        role: getUserRole(data.email || ""),
        createdAt: new Date().toISOString(),
        linkedin: data.linkedin,
        github: data.github,
      };
      saveSession(newUser);
      return newUser;
    }

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, acceptTerms: true }),
    });
    const result = await parseBody(res);
    if (!res.ok) throw new Error(result?.message || `Registration failed (${res.status}). Please try again.`);
    const payload = result!.data as { user: User; token: string };
    const registeredUser = { ...payload.user, role: getUserRole(payload.user.email) };
    saveSession(registeredUser, payload.token);
    return registeredUser;
  },

  async logout(): Promise<void> {
    if (!MOCK_MODE) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch { /* ignore */ }
    }
    clearSession();
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async sendOTP(phone: string): Promise<string> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 500));
      return "123456";
    }

    const res = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send OTP");
    return data.otp as string;
  },

  async resetPassword(phone: string, otp: string, newPassword: string): Promise<void> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }

    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to reset password");
  },

  updateCurrentUser(updates: Partial<User>): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    saveSession(updated);
    return updated;
  },

  async getAllUsers(): Promise<User[]> {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_URL}/api/auth/users`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    return data.data;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
