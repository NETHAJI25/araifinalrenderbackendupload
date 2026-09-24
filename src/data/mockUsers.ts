import type { User, Team } from "../types";

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const mockLeader: User = {
  id: "user_leader",
  name: "Aravind Test",
  email: "leader@demo.com",
  phone: "9876543210",
  college: "Demo Engineering College",
  course: "B.Tech Computer Science",
  year: "3rd Year",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  profileCompleted: true,
  paymentStatus: "paid",
  role: "participant",
  teamId: "IA26-DEMO1",
  createdAt: new Date("2026-09-01").toISOString(),
};

export const mockMember: User = {
  id: "user_member1",
  name: "Priya Member",
  email: "member@demo.com",
  phone: "9876543211",
  college: "Demo Engineering College",
  course: "B.Tech IT",
  year: "3rd Year",
  city: "Coimbatore",
  state: "Tamil Nadu",
  country: "India",
  profileCompleted: true,
  paymentStatus: "paid",
  role: "participant",
  teamId: "IA26-DEMO1",
  createdAt: new Date("2026-09-02").toISOString(),
};

export const mockUnpaidMember: User = {
  id: "user_unpaid",
  name: "Ravi Unpaid",
  email: "unpaid@demo.com",
  phone: "9876543212",
  college: "State College",
  course: "B.E Electronics",
  year: "4th Year",
  city: "Salem",
  state: "Tamil Nadu",
  country: "India",
  profileCompleted: true,
  paymentStatus: "pending",
  role: "participant",
  teamId: "IA26-DEMO1",
  createdAt: new Date("2026-09-03").toISOString(),
};

export const mockUsers: User[] = [mockLeader, mockMember, mockUnpaidMember];

// ─── Mock Teams ───────────────────────────────────────────────────────────────

export const mockTeamIncomplete: Team = {
  id: "team_demo_incomplete",
  teamId: "IA26-DEMO1",
  teamName: "Code Crusaders",
  leaderId: "user_leader",
  problemStatementId: "IA26001",
  problemStatementTitle: "AI-Based Adaptive Learning Platform for Rural Students",
  members: [
    {
      userId: "user_leader",
      name: "Aravind Test",
      college: "Demo Engineering College",
      role: "Team Leader",
      paymentStatus: "paid",
      profileCompleted: true,
      joinedAt: new Date("2026-09-01").toISOString(),
    },
  ],
  status: "active",
  confirmationStatus: "pending",
  createdAt: new Date("2026-09-01").toISOString(),
  updatedAt: new Date("2026-09-01").toISOString(),
};

export const mockTeamComplete: Team = {
  id: "team_demo_complete",
  teamId: "IA26-DEMO2",
  teamName: "Innovators United",
  leaderId: "user_leader",
  problemStatementId: "IA26001",
  problemStatementTitle: "AI-Based Adaptive Learning Platform for Rural Students",
  members: [
    {
      userId: "user_leader",
      name: "Aravind Test",
      college: "Demo Engineering College",
      role: "Team Leader",
      paymentStatus: "paid",
      profileCompleted: true,
      joinedAt: new Date("2026-09-01").toISOString(),
    },
    {
      userId: "user_member1",
      name: "Priya Member",
      college: "Demo Engineering College",
      role: "Member",
      paymentStatus: "paid",
      profileCompleted: true,
      joinedAt: new Date("2026-09-02").toISOString(),
    },
    {
      userId: "user_unpaid",
      name: "Ravi Unpaid",
      college: "State College",
      role: "Member",
      paymentStatus: "pending",
      profileCompleted: true,
      joinedAt: new Date("2026-09-03").toISOString(),
    },
  ],
  status: "active",
  confirmationStatus: "pending",
  createdAt: new Date("2026-09-01").toISOString(),
  updatedAt: new Date("2026-09-03").toISOString(),
};

export const mockTeamConfirmed: Team = {
  ...mockTeamComplete,
  id: "team_demo_confirmed",
  teamId: "IA26-DEMO3",
  teamName: "Tech Vanguard",
  members: mockTeamComplete.members.map((m) => ({
    ...m,
    paymentStatus: "paid" as const,
  })),
  confirmationStatus: "confirmed",
};
