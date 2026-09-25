import type { Team, TeamMember } from "../types";
import { authService } from "./authService";
import { generateTeamId } from "../utils/idGenerator";

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

export const teamService = {
  async createTeam(teamName: string, problemStatementId: string | null, problemStatementTitle: string | null): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // In mock mode, still use localStorage
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const existingTeam = teams.find((t: Team) => t.members.some((m) => m.userId === user.id));
      if (existingTeam) throw new Error("You are already in a team");

      const newTeam: Team = {
        id: `team_${Date.now()}`,
        teamId: generateTeamId(),
        teamName,
        leaderId: user.id,
        problemStatementId,
        problemStatementTitle,
        members: [{
          userId: user.id,
          name: user.name,
          college: user.college,
          role: "Team Leader",
          paymentStatus: user.paymentStatus,
          profileCompleted: user.profileCompleted,
          joinedAt: new Date().toISOString(),
        }],
        status: "active",
        confirmationStatus: "pending",
        round: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      teams.push(newTeam);
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      authService.updateCurrentUser({ teamId: newTeam.teamId });
      return newTeam;
    }

    const data = await apiFetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ teamName, problemStatementId, problemStatementTitle }),
    });
    authService.updateCurrentUser({ teamId: data.data.teamId });
    return data.data;
  },

  async joinTeam(teamId: string): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Invalid Team ID. Please check and try again.");
      if (team.members.length >= 6) throw new Error("This team is already full (maximum 6 members).");
      if (team.members.some((m: TeamMember) => m.userId === user.id)) throw new Error("You are already a member of this team.");
      const alreadyInOtherTeam = teams.find((t: Team) => t.id !== team.id && t.members.some((m: TeamMember) => m.userId === user.id));
      if (alreadyInOtherTeam) throw new Error("You are already in another team.");

      const member: TeamMember = {
        userId: user.id,
        name: user.name,
        college: user.college,
        role: "Member",
        paymentStatus: user.paymentStatus,
        profileCompleted: user.profileCompleted,
        joinedAt: new Date().toISOString(),
      };

      team.members.push(member);
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      authService.updateCurrentUser({ teamId: team.teamId });
      return team;
    }

    const data = await apiFetch("/api/teams/join", {
      method: "POST",
      body: JSON.stringify({ teamId }),
    });
    authService.updateCurrentUser({ teamId: data.data.teamId });
    return data.data;
  },

  async getTeam(teamId: string): Promise<Team | null> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      return teams.find((t: Team) => t.teamId === teamId) || null;
    }

    try {
      const data = await apiFetch(`/api/teams/${teamId}`);
      return data.data;
    } catch {
      return null;
    }
  },

  async getMyTeam(): Promise<Team | null> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      const user = authService.getCurrentUser();
      if (!user || !user.teamId) return null;
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      return teams.find((t: Team) => t.teamId === user.teamId) || null;
    }

    try {
      const data = await apiFetch("/api/teams/my");
      return data.data;
    } catch {
      return null;
    }
  },

  async confirmTeam(teamId: string): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      if (team.members.length < 2) throw new Error("Team must have at least 2 members to confirm.");

      team.confirmationStatus = "confirmed";
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      return team;
    }

    const data = await apiFetch(`/api/teams/${teamId}/confirm`, {
      method: "POST",
    });
    return data.data;
  },

  async updateTeamProblemStatement(teamId: string, psId: string, psTitle: string): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      team.problemStatementId = psId;
      team.problemStatementTitle = psTitle;
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      return team;
    }

    const data = await apiFetch(`/api/teams/${teamId}/problem-statement`, {
      method: "PUT",
      body: JSON.stringify({ problemStatementId: psId, problemStatementTitle: psTitle }),
    });
    return data.data;
  },

  async leaveTeam(teamId: string): Promise<void> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      if (team.leaderId === user.id) throw new Error("Team leader cannot leave the team.");
      team.members = team.members.filter((m: TeamMember) => m.userId !== user.id);
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      authService.updateCurrentUser({ teamId: null });
      return;
    }

    await apiFetch(`/api/teams/${teamId}/leave`, {
      method: "POST",
    });
    authService.updateCurrentUser({ teamId: null });
  },

  async markTeamComplete(teamId: string): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");
      if (team.members.length < 2 || team.members.length > 6) {
        throw new Error("Team must have between 2 and 6 members to be completed.");
      }
      team.status = "complete";
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      return team;
    }

    const data = await apiFetch(`/api/teams/${teamId}/complete`, {
      method: "POST",
    });
    return data.data;
  },

  // ─── ADMIN ACTIONS ────────────────────────────────────────────────────────────
  async getAll(): Promise<Team[]> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      return raw ? JSON.parse(raw) : [];
    }

    const data = await apiFetch("/api/admin/teams");
    return data.data;
  },

  async rejectTeam(teamId: string, reason: string): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");

      team.status = "rejected";
      team.rejectionReason = reason;
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      return team;
    }

    const data = await apiFetch(`/api/admin/teams/${teamId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return data.data;
  },

  async updateTeamRound(teamId: string, round: 1 | 2): Promise<Team> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      const TEAMS_KEY = "ia2_teams";
      const raw = localStorage.getItem(TEAMS_KEY);
      const teams = raw ? JSON.parse(raw) : [];
      const team = teams.find((t: Team) => t.teamId === teamId);
      if (!team) throw new Error("Team not found");

      team.round = round;
      team.updatedAt = new Date().toISOString();
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
      return team;
    }

    const data = await apiFetch(`/api/admin/teams/${teamId}/round`, {
      method: "PUT",
      body: JSON.stringify({ round }),
    });
    return data.data;
  },
};