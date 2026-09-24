import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, User, Users, FileText, Send, Megaphone, LogOut, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { eventConfig } from "../../config/eventConfig";
import { IALogoMark } from "../ui/IALogo";

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", to: "/dashboard" },
  { icon: <User className="w-4 h-4" />, label: "Profile", to: "/dashboard/profile" },
  { icon: <Users className="w-4 h-4" />, label: "My Team", to: "/dashboard/team" },
  { icon: <FileText className="w-4 h-4" />, label: "Problem Statements", to: "/dashboard/problem-statements" },
  { icon: <Send className="w-4 h-4" />, label: "Submission", to: "/dashboard/submission" },
  { icon: <Megaphone className="w-4 h-4" />, label: "Announcements", to: "/dashboard/announcements" },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({ mobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    addToast({ type: "success", title: "Signed out successfully" });
    navigate("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5 focus:outline-none">
          <IALogoMark size={32} />
          <div>
            <p className="text-xs font-bold text-gray-900 leading-none">{eventConfig.hackathonName}</p>
            <p className="text-[9px] text-violet-600 font-medium leading-none mt-0.5">
              36-Hour Hackathon
            </p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-violet-700 font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
               ${isActive
                 ? "bg-violet-50 text-violet-700"
                 : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <div className="relative w-64 bg-white h-full shadow-xl flex flex-col">
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
