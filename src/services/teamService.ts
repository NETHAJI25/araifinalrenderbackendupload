import type { Team, TeamMember } from "../types";
import { authService } from "./authService";
import { generateTeamId } from "../utils/idGenerator";

const TEAMS_KEY = "ia2_teams";

function getTeams(): Team[] {
  const raw = localStorage.getItem(TEAMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

function saveTeams(teams: Team[]) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export const teamService = {
  async createTeam(teamName: string, problemStatementId: string | null, problemStatementTitle: string | null): Promise<Team> {
    await new Promise((r) => setTimeout(r, 800));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const teams = getTeams();
    const existingTeam = teams.find((t) => t.members.some((m) => m.userId === user.id));
    if (existingTeam) throw new Error("You are already in a team");

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      teamId: generateTeamId(),
      teamName,
      leaderId: user.id,
      problemStatementId,
      problemStatementTitle,
      members: [
        {
          userId: user.id,
          name: user.name,
          college: user.college,
          role: "Team Leader",
          paymentStatus: user.paymentStatus,
          profileCompleted: user.profileCompleted,
          joinedAt: new Date().toISOString(),
        },
      ],
      status: "active",
      confirmationStatus: "pending",
      round: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teams.push(newTeam);
    saveTeams(teams);

    authService.updateCurrentUser({ teamId: newTeam.teamId });
    return newTeam;
  },

  async joinTeam(teamId: string): Promise<Team> {
    await new Promise((r) => setTimeout(r, 800));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Invalid Team ID. Please check and try again.");
    if (team.members.length >= 6) throw new Error("This team is already full (maximum 6 members).");
    if (team.members.some((m) => m.userId === user.id)) throw new Error("You are already a member of this team.");

    const alreadyInOtherTeam = teams.find((t) => t.id !== team.id && t.members.some((m) => m.userId === user.id));
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
    saveTeams(teams);

    authService.updateCurrentUser({ teamId: team.teamId });
    return team;
  },

  async getTeam(teamId: string): Promise<Team | null> {
    await new Promise((r) => setTimeout(r, 300));
    const teams = getTeams();
    return teams.find((t) => t.teamId === teamId) || null;
  },

  async getMyTeam(): Promise<Team | null> {
    await new Promise((r) => setTimeout(r, 300));
    const user = authService.getCurrentUser();
    if (!user || !user.teamId) return null;
    const teams = getTeams();
    return teams.find((t) => t.teamId === user.teamId) || null;
  },

  async confirmTeam(teamId: string): Promise<Team> {
    await new Promise((r) => setTimeout(r, 800));
    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Team not found");
    if (team.members.length < 2) throw new Error("Team must have at least 2 members to confirm.");

    team.confirmationStatus = "confirmed";
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
    return team;
  },

  async updateTeamProblemStatement(teamId: string, psId: string, psTitle: string): Promise<Team> {
    await new Promise((r) => setTimeout(r, 400));
    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Team not found");
    team.problemStatementId = psId;
    team.problemStatementTitle = psTitle;
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
    return team;
  },

  async leaveTeam(teamId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 600));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId === user.id) throw new Error("Team leader cannot leave the team.");
    team.members = team.members.filter((m) => m.userId !== user.id);
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
    authService.updateCurrentUser({ teamId: null });
  },

  async markTeamComplete(teamId: string): Promise<Team> {
    await new Promise((r) => setTimeout(r, 600));
    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Team not found");
    if (team.members.length < 2 || team.members.length > 6) {
      throw new Error("Team must have between 2 and 6 members to be completed.");
    }
    team.status = "complete";
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
    return team;
  },

  // ─── ADMIN ACTIONS ────────────────────────────────────────────────────────────
  async getAll(): Promise<Team[]> {
    await new Promise((r) => setTimeout(r, 400));
    return getTeams();
  },

  async rejectTeam(teamId: string, reason: string): Promise<Team> {
    await new Promise((r) => setTimeout(r, 600));
    const teams = getTeams();
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) throw new Error("Team not found");

    team.status = "rejected";
    team.rejectionReason = reason;
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
    return team;
  },
};
