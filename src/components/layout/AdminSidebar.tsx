import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCog, Megaphone, LogOut, X, CreditCard, Send, Lightbulb, FileText, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { label: "Overview", to: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, end: true },
  { label: "Teams", to: "/admin/teams", icon: <Users className="w-5 h-5" /> },
  { label: "Participants", to: "/admin/participants", icon: <UserCog className="w-5 h-5" /> },
  { label: "Payments", to: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Submissions", to: "/admin/submissions", icon: <Send className="w-5 h-5" /> },
  { label: "Problem Statements", to: "/admin/problem-statements", icon: <Lightbulb className="w-5 h-5" /> },
  { label: "Announcements", to: "/admin/announcements", icon: <Megaphone className="w-5 h-5" /> },
  { label: "Documents", to: "/admin/documents", icon: <FileText className="w-5 h-5" /> },
  { label: "Settings", to: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
];

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">IA <span className="text-violet-700">Admin</span></h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
              ${isActive ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block sticky top-0 h-screen shrink-0 z-20">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onMobileClose} aria-hidden="true" />
          <div className="relative flex w-full max-w-xs flex-1 animate-slide-right">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onMobileClose}
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
