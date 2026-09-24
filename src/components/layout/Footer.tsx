import { Mail, Phone, ExternalLink, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { eventConfig } from "../../config/eventConfig";

const footerNav = [
  { label: "Home", to: "/" },
  { label: "Problem Statements", to: "/problem-statements" },
  { label: "Timeline", to: "/timeline" },
  { label: "Guidelines", to: "/#guidelines" },
  { label: "Organizers", to: "/#organizers" },
  { label: "Sponsors", to: "/#sponsors" },
  { label: "FAQ", to: "/#faq" },
  { label: "Contact", to: "/#contact" },
];

const socialLinks = [
  { icon: <ExternalLink className="w-4 h-4" />, href: eventConfig.socialLinks.linkedin, label: "LinkedIn" },
  { icon: <Share2 className="w-4 h-4" />, href: eventConfig.socialLinks.instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <p className="text-white font-bold text-base leading-none">{eventConfig.hackathonName}</p>
              <p className="text-violet-400 text-xs font-medium mt-1">{eventConfig.type}</p>
              <p className="text-gray-400 text-xs mt-0.5">{eventConfig.location} • {eventConfig.finalRound}</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-xs">
              A national-level 36-hour hackathon bringing student innovators together to solve real-world challenges.
            </p>
            <div className="flex flex-col gap-2 mb-5 text-sm">
              <a href={`mailto:${eventConfig.contactEmail}`}
                className="flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors">
                <Mail className="w-4 h-4 shrink-0" />
                {eventConfig.contactEmail}
              </a>
              <a href={`tel:+91${eventConfig.contactPhone}`}
                className="flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors">
                <Phone className="w-4 h-4 shrink-0" />
                +91 {eventConfig.contactPhone}
              </a>
            </div>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              {footerNav.slice(0, 5).map((l) => (
                <li key={l.to}>
                  <Link to={l.to}
                    className="text-sm text-gray-400 hover:text-violet-400 transition-colors focus:outline-none focus:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">More</h3>
            <ul className="space-y-2.5">
              {footerNav.slice(5).map((l) => (
                <li key={l.to}>
                  <Link to={l.to}
                    className="text-sm text-gray-400 hover:text-violet-400 transition-colors focus:outline-none focus:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/problem-statements"
                  className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                  Browse All Problems
                </Link>
              </li>
              <li>
                <Link to="/dashboard"
                  className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col items-center justify-center gap-4">
          <p className="text-xs text-gray-500 text-center">{eventConfig.copyright}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {/* Policy links removed */}
          </div>
        </div>
      </div>
    </footer>
  );
}
