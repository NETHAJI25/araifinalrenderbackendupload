import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, User, LayoutDashboard, LogOut, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { eventConfig } from "../../config/eventConfig";
import { IALogoMark } from "../ui/IALogo";
import { Button } from "../ui/Button";

// Anchor-based public nav — all sections live on the homepage
const publicNav = [
  { label: "Home", to: "/", anchor: false },
  { label: "About", to: "/#about", anchor: true },
  { label: "Problem Statements", to: "/problem-statements", anchor: false },
  { label: "Timeline", to: "/timeline", anchor: false },
  { label: "Guidelines", to: "/#guidelines", anchor: true },
  { label: "Organizers", to: "/#organizers", anchor: true },
  { label: "Sponsors", to: "/#sponsors", anchor: true },
  { label: "FAQ", to: "/#faq", anchor: true },
  { label: "Contact", to: "/#contact", anchor: true },
];

function scrollToSection(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    const offset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    setProfileOpen(false);
    setMobileOpen(false);
    addToast({ type: "success", title: "Signed out successfully" });
    navigate("/login");
  }

  function handleNavClick(item: typeof publicNav[0], e: React.MouseEvent) {
    e.preventDefault();
    if (item.anchor) {
      const hash = item.to.split("#")[1];
      window.history.pushState(null, "", `#${hash}`);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          setMobileOpen(false);
          scrollToSection(hash);
        }, 100);
      } else {
        setMobileOpen(false);
        setTimeout(() => scrollToSection(hash), 150);
      }
    } else {
      navigate(item.to);
      setMobileOpen(false);
    }
  }

  const isActive = (item: typeof publicNav[0]) => {
    if (!item.anchor) {
      if (item.to === "/") return location.pathname === "/";
      return location.pathname.startsWith(item.to);
    }
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 bg-white transition-shadow duration-200
        ${scrolled ? "shadow-md border-b border-gray-100" : "border-b border-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg shrink-0"
            aria-label={`${eventConfig.hackathonName} — Home`}
          >
            <IALogoMark size={36} />
            <div className="hidden lg:block ml-2.5">
              <p className="text-sm font-bold text-gray-900 leading-none">{eventConfig.hackathonName}</p>
              <p className="text-[10px] text-violet-600 font-medium leading-none mt-0.5">
                National 36-Hour Hackathon
              </p>
            </div>
          </Link>

          {/* Mobile Center Title */}
          <div className="lg:hidden flex-1 flex justify-center px-2 min-w-0 pointer-events-none">
             <span className="text-sm sm:text-base font-bold text-gray-900 truncate">
               {eventConfig.hackathonName}
             </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {publicNav.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => handleNavClick(item, e)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                  ${isActive(item) ? "text-violet-700 bg-violet-50 font-semibold" : "text-gray-700 hover:text-violet-700 hover:bg-gray-50"}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[6rem] truncate">
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      {[
                        { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", to: "/dashboard" },
                        { icon: <User className="w-4 h-4" />, label: "Profile", to: "/dashboard/profile" },
                        { icon: <Users className="w-4 h-4" />, label: "My Team", to: "/dashboard/team" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                        >
                          <span className="text-gray-400">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-50 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center justify-end shrink-0">
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-gray-100 bg-white overflow-hidden max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
              {publicNav.map((item) => (
                <a
                  key={item.to}
                  href={item.to}
                  onClick={(e) => handleNavClick(item, e)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-violet-700 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">Register</Button>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
