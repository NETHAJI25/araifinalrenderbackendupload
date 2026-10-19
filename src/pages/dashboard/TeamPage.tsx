import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Copy, Check, Plus, LogIn, UserCheck,
  AlertCircle, Crown, CheckCircle, Clock, CreditCard, ChevronRight, ExternalLink
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { teamService } from "../../services/teamService";
import { paymentService as cashfreeApi } from "../../services/cashfreeService";
import { authService } from "../../services/authService";
import { CashfreePaymentModal } from "../../components/payment/CashfreePaymentModal";
import { problemStatements } from "../../data/problemStatements";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { paymentStatusLabel } from "../../utils/formatters";
import type { Team } from "../../types";
import { eventConfig } from "../../config/eventConfig";
import Seo from "../../components/seo/Seo";

const psOptions = problemStatements.map((ps) => ({
  value: ps.id,
  label: `${ps.localPsNumber} — ${ps.title.slice(0, 60)}${ps.title.length > 60 ? "…" : ""}`,
}));

export default function TeamPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedPS, setSelectedPS] = useState("");
  const [joinId, setJoinId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string; paymentSessionId: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState("");
  const [joinError, setJoinError] = useState("");

  const isLeader = team?.leaderId === user?.id;
  const memberCount = team?.members.length || 0;
  const teamHasMinMembers = memberCount >= eventConfig.teamMin;
  const teamIsComplete = team?.status === "complete" || team?.confirmationStatus === "confirmed";
  
  // Round 1: Only team leader pays ₹100 for PPT submission
  // Round 2: All members pay ₹200 each (current flow)
  const round1Fee = 100;
  const round2Fee = eventConfig.registrationFee; // 200
  
  // Check if team is in round 1 (not yet selected for finals)
  const isRound1 = team?.round === 1 || team?.round === undefined;
  const isRound2 = team?.round === 2;
  const currentRound = isRound2 ? 2 : 1;

  // Per-round payment: a member can pay in Round 1 (leader) AND Round 2.
  // The global payment_status is set by either round, so use `paidRounds`
  // (derived server-side from the payments table) for round-specific checks.
  const paidRoundsFor = (userId: string) =>
    team?.members.find((m) => m.userId === userId)?.paidRounds ?? [];
  const myPaidRounds = user ? paidRoundsFor(user.id) : [];
  const hasPaidThisRound = myPaidRounds.includes(currentRound);
  const leaderPaidRound1 = isRound1 && paidRoundsFor(team?.leaderId ?? "").includes(1);
  const paidCount = team?.members.filter((m) => (m.paidRounds ?? []).includes(currentRound)).length ?? 0;
  const allPaidRound2 = isRound2 && (team?.members.every((m) => (m.paidRounds ?? []).includes(2)) ?? false);
  
  // Round 2: All members pay ₹200
  const canPayRound2 = teamIsComplete && isRound2 && !hasPaidThisRound;
  
  const canConfirm = isLeader && teamIsComplete && allPaidRound2 && team?.confirmationStatus !== "confirmed";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = await teamService.getMyTeam();
      setTeam(t);
      setLoading(false);
    }
    load();
  }, [user]);

  // Handle the redirect back from the Cashfree checkout page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    const orderId = params.get("order_id");
    (async () => {
      try {
        if (orderId) await cashfreeApi.verifyPayment(orderId);
      } catch { /* verification/webhook will settle the status */ }
      authService.updateCurrentUser({ paymentStatus: "paid" });
      refreshUser();
      addToast({ type: "success", title: "Payment successful!", message: "Your payment has been confirmed." });
      window.history.replaceState({}, "", window.location.pathname);
      try {
        const t = await teamService.getMyTeam();
        setTeam(t);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateTeam() {
    setFormError("");
    if (!teamName.trim()) { setFormError("Team name is required"); return; }
    setActionLoading(true);
    try {
      const ps = problemStatements.find((p) => p.id === selectedPS);
      const newTeam = await teamService.createTeam(teamName.trim(), selectedPS || null, ps?.title || null);
      setTeam(newTeam);
      refreshUser();
      setCreateOpen(false);
      setTeamName(""); setSelectedPS("");
      addToast({ type: "success", title: "Team created!", message: `Your Team ID is ${newTeam.teamId}` });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create team");
    } finally { setActionLoading(false); }
  }

  async function handleJoinTeam() {
    setJoinError("");
    if (!joinId.trim()) { setJoinError("Please enter a Team ID"); return; }
    setActionLoading(true);
    try {
      const joined = await teamService.joinTeam(joinId.trim().toUpperCase());
      setTeam(joined);
      refreshUser();
      setJoinOpen(false); setJoinId("");
      addToast({ type: "success", title: "Team joined!", message: `You have joined ${joined.teamName}` });
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Failed to join team");
    } finally { setActionLoading(false); }
  }

  async function handlePayment() {
    if (!user) return;
    const fee = isRound1 ? round1Fee : round2Fee;
    const round = isRound1 ? 1 : 2;
    setPayLoading(true);
    try {
      const order = await cashfreeApi.createPaymentOrder(fee, round);
      setPendingOrder({
        orderId: order.orderId,
        paymentSessionId: order.paymentSessionId,
        amount: order.amount ?? fee,
      });
    } catch (e: unknown) {
      addToast({ type: "error", title: "Payment failed", message: e instanceof Error ? e.message : "Try again." });
    } finally {
      setPayLoading(false);
    }
  }

  async function handlePaymentSuccess() {
    const fee = pendingOrder?.amount ?? (isRound1 ? round1Fee : round2Fee);
    addToast({ type: "success", title: "Payment successful!", message: `₹${fee} registration fee paid.` });
    setPendingOrder(null);
    // Reflect the new status everywhere immediately (backend already synced by verify/webhook).
    authService.updateCurrentUser({ paymentStatus: "paid" });
    refreshUser();
    // Re-fetch the team so the per-round `paidRounds` come straight from the server.
    try {
      const t = await teamService.getMyTeam();
      setTeam(t);
    } catch {
      // Optimistic fallback if the refetch fails.
      if (team && user) {
        const updated = { ...team };
        const memberIdx = updated.members.findIndex((m) => m.userId === user.id);
        if (memberIdx >= 0) {
          const member = updated.members[memberIdx];
          member.paymentStatus = "paid";
          member.paidRounds = Array.from(new Set([...(member.paidRounds ?? []), currentRound]));
        }
        setTeam(updated);
      }
    }
  }

  function handlePaymentError(message: string) {
    setPendingOrder(null);
    addToast({ type: "error", title: "Payment failed", message });
  }

  async function handleCompleteTeam() {
    if (!team) return;
    setActionLoading(true);
    try {
      const completed = await teamService.markTeamComplete(team.teamId);
      setTeam(completed);
      addToast({ type: "success", title: "Team Completed!", message: "Payment is now available for all members." });
    } catch (e: unknown) {
      addToast({ type: "error", title: "Action failed", message: e instanceof Error ? e.message : "Try again." });
    } finally { setActionLoading(false); }
  }

  async function handleConfirmTeam() {
    if (!team) return;
    setActionLoading(true);
    try {
      const confirmed = await teamService.confirmTeam(team.teamId);
      setTeam(confirmed);
      setConfirmOpen(false);
      addToast({ type: "success", title: "Team confirmed!", message: "Your team is confirmed for the Finals." });
    } catch (e: unknown) {
      addToast({ type: "error", title: "Confirmation failed", message: e instanceof Error ? e.message : "Try again." });
    } finally { setActionLoading(false); }
  }

  function copyTeamId() {
    if (!team) return;
    navigator.clipboard.writeText(team.teamId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({ type: "info", title: "Copied!", message: `Team ID ${team.teamId} copied.` });
    });
  }

  const statusLabels: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending Confirmation", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    ready: { label: "Ready to Confirm", cls: "bg-blue-50 border-blue-200 text-blue-700" },
    confirmed: { label: "✓ Confirmed", cls: "bg-green-50 border-green-200 text-green-700" },
  };

  return (
    <>
      <Seo title={`My Team | ${eventConfig.hackathonName}`} noindex />
      <div className="mb-8">
        <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">Team Management</p>
        <h1 className="text-2xl font-black text-gray-900">My Team</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !team ? (
        /* ── No team yet ── */
        <div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="card p-6 flex flex-col items-center text-center hover:border-violet-200 hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-7 h-7 text-violet-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-2">Create a Team</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Start a new team. Share your Team ID with teammates to invite them.</p>
              <Button variant="primary" size="md" className="w-full" onClick={() => setCreateOpen(true)}>
                Create Team
              </Button>
            </div>
            <div className="card p-6 flex flex-col items-center text-center hover:border-violet-200 hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <LogIn className="w-7 h-7 text-violet-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-2">Join a Team</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Have a Team ID? Enter it to join your team.</p>
              <Button variant="secondary" size="md" className="w-full" onClick={() => setJoinOpen(true)}>
                Join Team
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            Ask your team leader for their Team ID (e.g., IA26-7F4K9).
          </p>
        </div>
      ) : (
        /* ── Has team ── */
        <div className="space-y-6">
          {/* Team ID card */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Team Name</p>
                <h2 className="text-xl font-black text-gray-900">{team.teamName}</h2>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${statusLabels[team.confirmationStatus]?.cls}`}>
                {statusLabels[team.confirmationStatus]?.label || team.confirmationStatus}
              </span>
            </div>

            {/* Team ID */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Team ID</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-lg font-black text-violet-800 tracking-widest bg-white border border-violet-200 px-3 py-1.5 rounded-lg">
                  {team.teamId}
                </span>
                <button onClick={copyTeamId}
                  className="flex items-center gap-1.5 text-xs text-violet-700 font-semibold bg-white border border-violet-300 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                  aria-label="Copy Team ID">
                  {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-xs text-violet-600 mt-2">Share this Team ID with your teammates so they can join.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">Members</p>
                <p className="text-base font-bold text-gray-900">{memberCount} / {eventConfig.teamMax}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">Payments</p>
                <p className="text-base font-bold text-gray-900">{paidCount} / {memberCount} Paid</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:col-span-1">
                <p className="text-xs font-semibold text-gray-400 uppercase">Problem Statement</p>
                <p className="text-xs font-bold text-gray-700 line-clamp-2 mt-0.5">
                  {team.problemStatementTitle || <span className="text-gray-400">Not selected</span>}
                </p>
                {team.problemStatementId && (
                  <Link to={`/dashboard/problem-statements/${team.problemStatementId}`} className="text-xs text-violet-700 hover:underline font-medium">
                    View →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" /> Team Members ({memberCount})
              </h2>
              {memberCount < eventConfig.teamMax && (
                <p className="text-xs text-gray-400">{eventConfig.teamMax - memberCount} slot{eventConfig.teamMax - memberCount !== 1 ? "s" : ""} available</p>
              )}
            </div>

            <div className="space-y-3">
              {team.members.map((m) => {
                const ps = paymentStatusLabel(m.paymentStatus);
                const isMemberLeader = m.userId === team.leaderId;
                return (
                  <div key={m.userId}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isMemberLeader ? "border-violet-200 bg-violet-50/60" : "border-gray-100 bg-gray-50/60"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isMemberLeader ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                          {isMemberLeader && <Crown className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{m.college || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ps.color}`}>{ps.label}</span>
                      <Badge variant={isMemberLeader ? "violet" : "gray"}>{m.role}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {memberCount < eventConfig.teamMin && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">Your team needs at least {eventConfig.teamMin} members. Share your Team ID to invite teammates.</p>
              </div>
            )}

            {!teamIsComplete && teamHasMinMembers && isLeader && (
              <div className="mt-4 p-4 border border-violet-200 bg-violet-50 rounded-xl">
                <h3 className="text-sm font-bold text-violet-900 mb-2">Ready to Complete Team?</h3>
                <p className="text-xs text-violet-700 mb-4">You have the minimum required members. Mark the team as complete to proceed to individual payments.</p>
                <Button variant="primary" size="sm" loading={actionLoading} onClick={handleCompleteTeam}>
                  Complete Team
                </Button>
              </div>
            )}
          </div>

          {/* Payment section — Round-based flow */}
          {teamIsComplete && (
            <div className={`card p-6 ${(isRound2 && allPaidRound2) || (isRound1 && leaderPaidRound1) ? "border-green-200 bg-green-50/30" : "border-violet-200 bg-violet-50/30"}`}>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-600" /> Registration Payment
              </h2>
              
              {isRound1 ? (
                // Round 1: Team Leader pays ₹100 for PPT submission
                <>
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Round 1: Team Leader Payment
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Only the <strong>Team Leader</strong> pays <strong>₹{round1Fee}</strong> to submit the PPT for first round evaluation.
                      Once selected for finals, all members will pay ₹{round2Fee} each.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 bg-white rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Round 1 Status</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">
                        {leaderPaidRound1 ? "Leader Paid ₹100 ✓" : "Pending Leader Payment"}
                      </p>
                    </div>
                    {leaderPaidRound1 ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  {isLeader && !leaderPaidRound1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your Payment (Team Leader)</p>
                        <p className="text-xs text-amber-700">₹{round1Fee} — Pending (PPT Submission)</p>
                      </div>
                      <Button variant="primary" size="sm" loading={payLoading} onClick={handlePayment}
                        leftIcon={!payLoading ? <CreditCard className="w-4 h-4" /> : undefined}>
                        Pay ₹{round1Fee} & Submit PPT
                      </Button>
                    </div>
                  )}

                  {leaderPaidRound1 && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-sm font-semibold text-green-800">Team Leader payment complete (₹{round1Fee}).</p>
                      </div>
                      {isLeader ? (
                        <>
                          <p className="text-sm text-green-700 mt-2">
                            Now submit your project for Round 1 evaluation using the official form.
                          </p>
                          <a
                            href={eventConfig.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
                            data-testid="round1-submission-form-link"
                          >
                            <ExternalLink className="w-4 h-4" /> Open Round 1 Submission Form
                          </a>
                        </>
                      ) : (
                        <p className="text-sm text-green-700 mt-2">
                          The Team Leader will submit the project for Round 1 evaluation.
                        </p>
                      )}
                    </div>
                  )}

                  {!isLeader && !leaderPaidRound1 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 mb-3">
                      <span className="w-4 h-4 text-blue-500 shrink-0">ℹ️</span>
                      <p className="text-sm text-blue-800">Wait for Team Leader to pay ₹{round1Fee} and submit PPT for Round 1.</p>
                    </div>
                  )}
                </>
              ) : (
                // Round 2: All members pay ₹200
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Round 2 (Finals):</strong> Each team member must pay <strong>₹{round2Fee}</strong> individually. All members must complete payment before the team can be confirmed for the Finals.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 bg-white rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Team Payment Progress</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{paidCount} / {memberCount} Paid</p>
                    </div>
                    {allPaidRound2 ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  {!hasPaidThisRound && canPayRound2 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your Payment</p>
                        <p className="text-xs text-amber-700">₹{round2Fee} — Pending</p>
                      </div>
                      <Button variant="primary" size="sm" loading={payLoading} onClick={handlePayment}
                        leftIcon={!payLoading ? <CreditCard className="w-4 h-4" /> : undefined}>
                        Pay ₹{round2Fee}
                      </Button>
                    </div>
                  )}

                  {hasPaidThisRound && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-sm font-semibold text-green-800">Your payment is complete (₹{round2Fee})</p>
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-gray-400">
                Payments are processed securely via Cashfree.
              </p>
            </div>
          )}

          {/* Confirm team — leader only, after all paid (Round 2 only) */}
          {isLeader && teamIsComplete && isRound2 && (
            <div className={`card p-6 ${team.confirmationStatus === "confirmed" ? "border-green-200 bg-green-50/30" : ""}`}>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-600" /> Team Confirmation (Round 2 - Finals)
              </h2>
              {team.confirmationStatus === "confirmed" ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Team Confirmed</p>
                    <p className="text-xs text-green-600">Your team is confirmed for the Finals. Watch the Announcements page for final round details.</p>
                    <Link to="/dashboard/announcements" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline">
                      View Announcements <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {[
                      { check: memberCount >= eventConfig.teamMin, label: `Minimum ${eventConfig.teamMin} members` },
                      { check: memberCount <= eventConfig.teamMax, label: `Maximum ${eventConfig.teamMax} members` },
                      { check: allPaidRound2, label: `All ${memberCount} members have paid ₹${round2Fee}` },
                    ].map(({ check, label }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        {check ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <Clock className="w-4 h-4 text-gray-300 shrink-0" />}
                        <span className={check ? "text-gray-700" : "text-gray-400"}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" size="md" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
                    Confirm Team
                  </Button>
                  {!canConfirm && !allPaidRound2 && (
                    <p className="text-xs text-amber-600 mt-2">All team members must complete payment before you can confirm.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Member wait message */}
          {!isLeader && team && !teamIsComplete && (
            <div className="card p-5 bg-gray-50 border-gray-200 mb-6">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                Waiting for Team Leader to complete the team.
              </p>
            </div>
          )}
          {!isLeader && team && isRound2 && teamIsComplete && team.confirmationStatus !== "confirmed" && (
            <div className="card p-5 bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                Waiting for Team Leader to confirm the team after all members complete payment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setFormError(""); }} title="Create Your Team" size="md">
        <div className="space-y-4">
          <Input label="Team Name" placeholder="e.g. Code Crusaders" required
            value={teamName} onChange={(e) => setTeamName(e.target.value)}
            error={formError && !teamName ? formError : ""} />
          <Select label="Problem Statement (Optional)" options={psOptions} placeholder="Select a problem statement"
            value={selectedPS} onChange={(e) => setSelectedPS(e.target.value)} />
          {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
          <p className="text-xs text-gray-400">After creating your team, share the generated Team ID with your teammates.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setCreateOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleCreateTeam} loading={actionLoading}>Create Team</Button>
          </div>
        </div>
      </Modal>

      {/* Join Modal */}
      <Modal isOpen={joinOpen} onClose={() => { setJoinOpen(false); setJoinError(""); }} title="Join an Existing Team" size="sm">
        <div className="space-y-4">
          <Input label="Team ID" placeholder="e.g. IA26-7F4K9"
            value={joinId} onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            error={joinError} hint="Ask your team leader for the Team ID" />
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setJoinOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleJoinTeam} loading={actionLoading}>Join Team</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmTeam}
        title="Confirm Your Team"
        message="Once confirmed, your team is finalized for the Finals. Are you ready?"
        confirmLabel="Confirm Team" loading={actionLoading}
      />

      {/* Cashfree Payment Modal */}
      {pendingOrder && user && (
        <CashfreePaymentModal
          isOpen={!!pendingOrder}
          onClose={() => setPendingOrder(null)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          amount={pendingOrder.amount}
          orderId={pendingOrder.orderId}
          paymentSessionId={pendingOrder.paymentSessionId}
          customerName={user.name}
          customerEmail={user.email}
          customerPhone={user.phone}
        />
      )}
    </>
  );
}
