import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle, AlertCircle, Users, Send, FileText,
  Megaphone, ChevronRight, CreditCard
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { profileCompletionPercent, paymentStatusLabel } from "../../utils/formatters";
import { eventConfig } from "../../config/eventConfig";
import { teamService } from "../../services/teamService";

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
    teamService.getMyTeam().then(t => setTeam(t));
  }, [refreshUser]);

  if (!user) return null;

  const profilePct = profileCompletionPercent(user);
  const profileDone = profilePct === 100;
  const isPaid = user.paymentStatus === "paid" || user.paymentStatus === "verified";
  const hasTeam = !!user.teamId;
  const teamComplete = team?.status === "complete" || team?.confirmationStatus === "confirmed";
  
  // Round-based logic
  const isRound1 = team?.round === 1 || team?.round === undefined;
  const isRound2 = team?.round === 2;
  const round1Fee = 100;
  const round2Fee = eventConfig.registrationFee; // 200
  const leaderPaidRound1 = team?.leaderId === user.id && isPaid && isRound1;
  const allPaidRound2 = isRound2 && (team?.members?.every((m: any) => m.paymentStatus === "paid" || m.paymentStatus === "verified") ?? false);

  // Payment display logic
  const getPaymentDisplay = () => {
    if (!hasTeam) return { value: "₹200", sub: "Join a team first", color: "text-gray-500 bg-gray-50" };
    if (isRound1) {
      if (team?.leaderId === user.id) {
        return leaderPaidRound1 
          ? { value: "Round 1 Paid", sub: "₹100 ✓ Awaiting results", color: "text-green-600 bg-green-50" }
          : { value: `₹${round1Fee}`, sub: "Round 1: Leader pays", color: "text-amber-600 bg-amber-50" };
      }
      return { value: `₹${round1Fee}`, sub: "Leader submits PPT", color: "text-blue-600 bg-blue-50" };
    }
    if (isRound2) {
      return isPaid
        ? { value: "Round 2 Paid", sub: `₹${round2Fee} ✓`, color: "text-green-600 bg-green-50" }
        : { value: `₹${round2Fee}`, sub: "Round 2: All members pay", color: "text-amber-600 bg-amber-50" };
    }
    return { value: `₹${eventConfig.registrationFee}`, sub: paymentStatusLabel(user.paymentStatus).label, color: isPaid ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50" };
  };

  const payDisplay = getPaymentDisplay();

  // Progress steps (Round-aware)
  const steps: { label: string; status: "completed" | "current" | "locked" }[] = [
    { label: "Create Account", status: "completed" },
    { label: "Complete Profile", status: profileDone ? "completed" : "current" },
    { label: "Create / Join Team", status: !profileDone ? "locked" : hasTeam ? "completed" : "current" },
    { label: "Complete Team", status: !hasTeam ? "locked" : teamComplete ? "completed" : "current" },
    { label: isRound1 ? "Round 1: Leader PPT (₹100)" : "Round 2: Payment (₹200 each)", status: !teamComplete ? "locked" : isRound1 ? (leaderPaidRound1 ? "completed" : "current") : (isPaid ? "completed" : "current") },
    { label: isRound1 ? "Round 1 Results" : "Confirm Team", status: isRound1 ? "locked" : !isPaid ? "locked" : (team?.confirmationStatus === "confirmed" ? "completed" : "current") },
    { label: "Submit Project", status: isRound1 ? "locked" : (team?.confirmationStatus === "confirmed" && allPaidRound2 ? "current" : "locked") },
  ];

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
          { label: "Payment", icon: <CreditCard className="w-5 h-5" />, value: payDisplay.value, sub: payDisplay.sub, color: payDisplay.color, href: "/dashboard/team" },
          { label: "Submission", icon: <Send className="w-5 h-5" />, value: isRound1 ? "Round 1" : (team?.confirmationStatus === "confirmed" && allPaidRound2 ? "Ready" : "Locked"), sub: isRound1 ? "Submit PPT first" : (team?.confirmationStatus === "confirmed" && allPaidRound2 ? "Open form" : "Complete steps first"), color: isRound1 ? "text-blue-600 bg-blue-50" : (team?.confirmationStatus === "confirmed" && allPaidRound2 ? "text-green-600 bg-green-50" : "text-gray-500 bg-gray-50"), href: "/dashboard/submission" },
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

          {/* Payment note — round-aware */}
          {teamComplete && (
            <div className="card p-5 border-amber-200 bg-amber-50 flex items-start justify-between gap-3">
              <div>
                {isRound1 ? (
                  team?.leaderId === user.id ? (
                    leaderPaidRound1 ? (
                      <>
                        <p className="text-sm font-bold text-green-800">Round 1 PPT Submitted ✓</p>
                        <p className="text-xs text-green-700 mt-0.5">Awaiting evaluation results. Team will advance to Round 2 if selected.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-amber-900">Round 1: Submit PPT</p>
                        <p className="text-xs text-amber-700 mt-0.5">Team Leader pays ₹{round1Fee} and submits PPT for evaluation.</p>
                        <Link to="/dashboard/team" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">
                          Go to My Team <ChevronRight className="w-3 h-3" />
                        </Link>
                      </>
                    )
                  ) : (
                    <>
                      <p className="text-sm font-bold text-blue-800">Round 1: Waiting for Leader</p>
                      <p className="text-xs text-blue-700 mt-0.5">Team Leader will pay ₹{round1Fee} and submit PPT for evaluation.</p>
                    </>
                  )
                ) : (
                  isPaid ? (
                    <>
                      <p className="text-sm font-bold text-green-800">Round 2 Payment Complete ✓</p>
                      <p className="text-xs text-green-700 mt-0.5">All members paid ₹{round2Fee}. Ready for team confirmation.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-amber-900">Round 2: Complete Payment</p>
                      <p className="text-xs text-amber-700 mt-0.5">Pay ₹{round2Fee} to unlock team confirmation and submission.</p>
                      <Link to="/dashboard/team" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">
                        Go to My Team <ChevronRight className="w-3 h-3" />
                      </Link>
                    </>
                  )
                )}
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
