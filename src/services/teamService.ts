import type { Team } from "../types";
import { authService } from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "https://araifinalrenderbackendupload.onrender.com";

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

export const teamService = {
  async createTeam(teamName: string, problemStatementId: string | null, problemStatementTitle: string | null): Promise<Team> {
    const data = await fetchWithAuth("/api/teams", {
      method: "POST",
      body: JSON.stringify({ teamName, problemStatementId, problemStatementTitle }),
    });
    return data.data;
  },

  async joinTeam(teamId: string): Promise<Team> {
    const data = await fetchWithAuth(`/api/teams/join/${teamId}`, {
      method: "POST",
    });
    return data.data;
  },

  async getMyTeam(): Promise<Team | null> {
    try {
      const data = await fetchWithAuth("/api/teams/my");
      return data.data;
    } catch {
      return null;
    }
  },

  async getTeam(teamId: string): Promise<Team> {
    const data = await fetchWithAuth(`/api/teams/${teamId}`);
    return data.data;
  },

  async getAll(): Promise<Team[]> {
    const data = await fetchWithAuth("/api/teams");
    return data.data;
  },

  async markTeamComplete(teamId: string): Promise<Team> {
    const data = await fetchWithAuth("/api/teams/complete", {
      method: "POST",
      body: JSON.stringify({ teamId }),
    });
    return data.data;
  },

  async confirmTeam(teamId: string): Promise<Team> {
    const data = await fetchWithAuth("/api/teams/confirm", {
      method: "POST",
      body: JSON.stringify({ teamId }),
    });
    return data.data;
  },

  async rejectTeam(teamId: string, reason: string): Promise<Team> {
    const data = await fetchWithAuth("/api/teams/reject", {
      method: "POST",
      body: JSON.stringify({ teamId, reason }),
    });
    return data.data;
  },
};