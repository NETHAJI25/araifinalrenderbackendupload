// ─── User ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  year: string;
  city: string;
  state: string;
  country: string;
  profileCompleted: boolean;
  paymentStatus: "pending" | "processing" | "paid" | "failed" | "verified";
  teamId: string | null;
  role: "admin" | "participant";
  createdAt: string;
  linkedin?: string;
  github?: string;
}

// ─── Team ────────────────────────────────────────────────────────────────────
export interface TeamMember {
  userId: string;
  name: string;
  college: string;
  role: "Team Leader" | "Member";
  paymentStatus: "pending" | "processing" | "paid" | "failed" | "verified";
  profileCompleted: boolean;
  joinedAt: string;
  paidRounds?: number[];
}

export interface Team {
  id: string;
  teamId: string;
  teamName: string;
  leaderId: string;
  problemStatementId: string | null;
  problemStatementTitle: string | null;
  members: TeamMember[];
  status: "active" | "inactive" | "rejected" | "complete";
  rejectionReason?: string;
  confirmationStatus: "pending" | "ready" | "confirmed";
  round?: 1 | 2;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "created" | "initiated" | "pending" | "processing" | "paid" | "failed" | "expired" | "verified";
  reference: string | null;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
  cfOrderId?: string | null;
  cfPaymentId?: string | null;
  paymentSessionId?: string | null;
  round?: number;
  teamId?: string | null;
  method?: string | null;
}

// ─── Admin payment (payment + joined user/team info) ──────────────────────────
export interface AdminPayment extends Payment {
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  teamName: string | null;
}

export interface PaymentSummary {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  totalCollected: number;
  round1Collected: number;
  round2Collected: number;
}

// ─── Submission ───────────────────────────────────────────────────────────────
export interface Submission {
  submissionId: string;
  teamId: string;
  teamName: string;
  problemStatementId: string;
  problemStatementTitle: string;
  projectTitle: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  demoUrl: string;
  pptFile: string | null;
  status: "draft" | "submitted" | "under_review" | "evaluated";
  submittedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface ToastNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

// ─── Announcement ─────────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "Normal" | "Important" | "Urgent";
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}
