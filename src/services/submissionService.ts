import type { Submission } from "../types";
import { authService } from "./authService";
import { generateSubmissionId } from "../utils/idGenerator";

const SUBMISSIONS_KEY = "ia2_submissions";

function getSubmissions(): Submission[] {
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

function saveSubmissions(s: Submission[]) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(s));
}

export const submissionService = {
  async submitProject(data: Omit<Submission, "submissionId" | "status" | "submittedAt">): Promise<Submission> {
    await new Promise((r) => setTimeout(r, 1200));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const submissions = getSubmissions();
    const existing = submissions.find((s) => s.teamId === data.teamId);
    if (existing) throw new Error("This team has already submitted a project.");

    const submission: Submission = {
      ...data,
      submissionId: generateSubmissionId(),
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };

    submissions.push(submission);
    saveSubmissions(submissions);
    return submission;
  },

  async getMySubmission(teamId: string): Promise<Submission | null> {
    await new Promise((r) => setTimeout(r, 300));
    const submissions = getSubmissions();
    return submissions.find((s) => s.teamId === teamId) || null;
  },

  async updateSubmission(submissionId: string, updates: Partial<Submission>): Promise<Submission> {
    await new Promise((r) => setTimeout(r, 600));
    const submissions = getSubmissions();
    const s = submissions.find((x) => x.submissionId === submissionId);
    if (!s) throw new Error("Submission not found");
    Object.assign(s, updates);
    saveSubmissions(submissions);
    return s;
  },

  async getAll(): Promise<Submission[]> {
    await new Promise((r) => setTimeout(r, 300));
    return getSubmissions();
  }
};
