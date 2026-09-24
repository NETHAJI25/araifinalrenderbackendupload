import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/ui/Toast";
import { PublicLayout } from "./layouts/PublicLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute, GuestRoute, AdminRoute } from "./routes/ProtectedRoute";

// Public pages
import HomePage from "./pages/HomePage";
import ProblemStatementsPage from "./pages/ProblemStatementsPage";
import ProblemStatementDetailPage from "./pages/ProblemStatementDetailPage";
import TimelinePage from "./pages/TimelinePage";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import ProfilePage from "./pages/dashboard/ProfilePage";
import TeamPage from "./pages/dashboard/TeamPage";
import DashboardProblemStatementsPage from "./pages/dashboard/DashboardProblemStatementsPage";
import DashboardPSDetailPage from "./pages/dashboard/DashboardPSDetailPage";
import SubmissionPage from "./pages/dashboard/SubmissionPage";
import AnnouncementsPage from "./pages/dashboard/AnnouncementsPage";

// Admin pages
import AdminHome from "./pages/admin/AdminHome";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminParticipants from "./pages/admin/AdminParticipants";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminTeamDetails from "./pages/admin/AdminTeamDetails";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminProblemStatements from "./pages/admin/AdminProblemStatements";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Public ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/problem-statements" element={<ProblemStatementsPage />} />
              <Route path="/problem-statements/:id" element={<ProblemStatementDetailPage />} />
              <Route path="/timeline" element={<TimelinePage />} />

              {/* Old section routes → redirect to homepage anchors */}
              <Route path="/about" element={<Navigate to="/#about" replace />} />
              <Route path="/guidelines" element={<Navigate to="/#guidelines" replace />} />
              <Route path="/organizers" element={<Navigate to="/#organizers" replace />} />
              <Route path="/sponsors" element={<Navigate to="/#sponsors" replace />} />
              <Route path="/faq" element={<Navigate to="/#faq" replace />} />
              <Route path="/contact" element={<Navigate to="/#contact" replace />} />
            </Route>

            {/* ── Auth ── */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* ── Dashboard ── */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
            >
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="problem-statements" element={<DashboardProblemStatementsPage />} />
              <Route path="problem-statements/:id" element={<DashboardPSDetailPage />} />
              <Route path="submission" element={<SubmissionPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              {/* Remove old /dashboard/documents — redirect to submission */}
              <Route path="documents" element={<Navigate to="/dashboard/submission" replace />} />
              <Route path="settings" element={<Navigate to="/dashboard/profile" replace />} />
            </Route>

            {/* ── Admin ── */}
            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<AdminHome />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="teams/:teamId" element={<AdminTeamDetails />} />
              <Route path="participants" element={<AdminParticipants />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="problem-statements" element={<AdminProblemStatements />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* ── 404 fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
