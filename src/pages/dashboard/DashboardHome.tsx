import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle, AlertCircle, Users, Send, FileText,
  Megaphone, ChevronRight, CreditCard
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { profileCompletionPercent, paymentStatusLabel } from "../../utils/formatters";
import { eventConfig } from "../../config/eventConfig";

// Progress step — order: Account → Profile → Team → Complete Team → Payment → Confirm → Submit
function StepItem({ num, label, status }: {
  num: number; label: string; status: "completed" | "current" | "locked"
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors
      ${status === "current" ? "bg-violet-50 border border-violet-200" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${status === "completed" ? "bg-green-100 text-green-700" : status === "current" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"}`}>
        {status === "completed" ? <CheckCircle className="w-4 h-4" /> : num}
      </div>
      <span className={`text-sm font-medium ${status === "locked" ? "text-gray-400" : "text-gray-800"}`}>{label}</span>
      {status === "current" && <span className="ml-auto text-xs text-violet-600 font-semibold">Active</span>}
    </div>
  );
}

export default function DashboardHome() {
  const { user, refreshUser } = useAuth();
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    refreshUser();
    import("../../services/teamService").then(({ teamService }) => {
      teamService.getMyTeam().then(t => setTeam(t));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const profilePct = profileCompletionPercent(user);
  const profileDone = profilePct === 100;
  const isPaid = user.paymentStatus === "paid" || user.paymentStatus === "verified";
  const hasTeam = !!user.teamId;
  const teamComplete = team?.status === "complete" || team?.confirmationStatus === "confirmed";

  // NEW ORDER: 1 Account, 2 Profile, 3 Create/Join Team, 4 Complete Team, 5 Payment, 6 Confirm, 7 Submit
  const steps: { label: string; status: "completed" | "current" | "locked" }[] = [
    { label: "Create Account", status: "completed" },
    { label: "Complete Profile", status: profileDone ? "completed" : "current" },
    { label: "Create / Join Team", status: !profileDone ? "locked" : hasTeam ? "completed" : "current" },
    { label: "Complete Team", status: !hasTeam ? "locked" : teamComplete ? "completed" : "current" },
    { label: "Complete Payment", status: !teamComplete ? "locked" : isPaid ? "completed" : "current" },
    { label: "Confirm Team", status: !isPaid ? "locked" : "current" },
    { label: "Submit Project", status: "locked" },
  ];

  const payStatus = paymentStatusLabel(user.paymentStatus);

  return (
    <>
      <title>{`Dashboard | ${eventConfig.hackathonName}`}</title>

      <div className="mb-8">
        <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">Dashboard</p>
        <h1 className="text-2xl font-black text-gray-900">Welcome back, {user.name.split(" ")[0]}!</h1>
        <p className="text-sm text-gray-500 mt-1">
          {eventConfig.hackathonName} · {eventConfig.type} · {eventConfig.location} · {eventConfig.finalRound}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Profile", icon: <CheckCircle className="w-5 h-5" />, value: `${profilePct}%`, sub: "Complete", color: profileDone ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50", href: "/dashboard/profile" },
          { label: "Team", icon: <Users className="w-5 h-5" />, value: hasTeam ? user.teamId! : "No Team", sub: hasTeam ? "Joined" : "Not joined", color: hasTeam ? "text-violet-700 bg-violet-50" : "text-gray-500 bg-gray-50", href: "/dashboard/team", mono: hasTeam },
          { label: "Payment", icon: <CreditCard className="w-5 h-5" />, value: isPaid ? "Paid" : `₹${eventConfig.registrationFee}`, sub: payStatus.label, color: isPaid ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50", href: "/dashboard/team" },
          { label: "Submission", icon: <Send className="w-5 h-5" />, value: "Locked", sub: "Complete steps first", color: "text-gray-500 bg-gray-50", href: "/dashboard/submission" },
        ].map((card) => (
          <Link key={card.label} to={card.href}
            className="card p-4 hover:border-violet-200 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-violet-400">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>{card.icon}</div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-sm font-bold truncate ${card.mono ? "font-mono text-violet-700" : "text-gray-900"}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile alert */}
          {!profileDone && (
            <div className="card p-5 border-amber-200 bg-amber-50 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">Complete Your Profile</p>
                <p className="text-xs text-amber-700 mt-0.5">Fill in all required fields to unlock team and payment features.</p>
                <Link to="/dashboard/profile" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">
                  Complete Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
          )}

          {/* Payment note — only show after team complete */}
          {teamComplete && !isPaid && (
            <div className="card p-5 border-amber-200 bg-amber-50 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">Complete Your Payment</p>
                <p className="text-xs text-amber-700 mt-0.5">Pay ₹{eventConfig.registrationFee} to unlock team confirmation and submission.</p>
                <Link to="/dashboard/team" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">
                  Go to My Team <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "My Team", icon: <Users className="w-4 h-4" />, to: "/dashboard/team" },
                { label: "Problem Statements", icon: <FileText className="w-4 h-4" />, to: "/dashboard/problem-statements" },
                { label: "Submission", icon: <Send className="w-4 h-4" />, to: "/dashboard/submission" },
                { label: "Profile", icon: <CheckCircle className="w-4 h-4" />, to: "/dashboard/profile" },
                { label: "Announcements", icon: <Megaphone className="w-4 h-4" />, to: "/dashboard/announcements" },
                { label: "Guidelines", icon: <FileText className="w-4 h-4" />, to: "/#guidelines" },
              ].map((a) => (
                <Link key={a.label} to={a.to}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 text-center transition-colors text-xs font-medium text-gray-700 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <span className="text-violet-600">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Your Progress</h2>
            <div className="space-y-1">
              {steps.map((s, i) => (
                <StepItem key={s.label} num={i + 1} label={s.label} status={s.status} />
              ))}
            </div>
          </div>


        </div>
      </div>
    </>
  );
}
