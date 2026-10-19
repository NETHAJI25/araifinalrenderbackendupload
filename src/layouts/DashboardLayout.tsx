import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "../components/layout/DashboardSidebar";
import { useAuth } from "../contexts/AuthContext";
import { eventConfig } from "../config/eventConfig";

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <DashboardSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Dashboard top bar (mobile only) */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm font-bold text-gray-900">{eventConfig.hackathonName}</p>
          <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
            <span className="text-violet-700 font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
