import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, ExternalLink, FileText, Lock, Users, CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { teamService } from "../../services/teamService";
import { documents } from "../../data/documents";
import { Button } from "../../components/ui/Button";
import type { Team } from "../../types";
import { eventConfig } from "../../config/eventConfig";

export default function SubmissionPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService.getMyTeam().then((t) => { setTeam(t); setLoading(false); });
  }, []);

  if (!user) return null;

  const isLeader = team?.leaderId === user.id;
  const memberCount = team?.members.length ?? 0;
  const isRound2 = team?.round === 2;
  const round2Fee = eventConfig.registrationFee; // 200
  
  // Round 2: All members must pay ₹200
  const allPaidRound2 = isRound2 && (team?.members ?? []).every((m) => m.paymentStatus === "paid" || m.paymentStatus === "verified");
  const paidCount = (team?.members ?? []).filter((m) => m.paymentStatus === "paid" || m.paymentStatus === "verified").length;
  const isConfirmed = team?.confirmationStatus === "confirmed";

  // Eligibility = Round 2 + team exists + 4–6 members + all paid (₹200) + leader confirmed
  const isEligible = !!team && isRound2 && memberCount >= eventConfig.teamMin && memberCount <= eventConfig.teamMax && allPaidRound2 && isConfirmed;

  const checks = [
    { check: !!team, label: "Team created", detail: team ? team.teamName : "No team found" },
    { check: memberCount >= eventConfig.teamMin, label: `Minimum ${eventConfig.teamMin} members`, detail: `${memberCount} member(s)` },
    { check: isRound2, label: "Round 1 Qualified", detail: isRound2 ? "Selected for Finals" : "Pending Round 1 results" },
    { check: allPaidRound2, label: `All members paid ₹${round2Fee}`, detail: `${paidCount} / ${memberCount} paid` },
    { check: isConfirmed, label: "Team confirmed by leader", detail: isConfirmed ? "Confirmed" : "Pending confirmation" },
  ];

  return (
    <>
      <title>{`Submission | ${eventConfig.hackathonName}`}</title>

      <div className="mb-8">
        <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">Final Submission</p>
        <h1 className="text-2xl font-black text-gray-900">Project Submission</h1>
        <p className="text-sm text-gray-500 mt-1">
          Only the Team Leader can submit the final project form.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Eligibility checklist */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-600" /> Submission Requirements
            </h2>
            <div className="space-y-3">
              {checks.map(({ check, label, detail }) => (
                <div key={label} className="flex items-start gap-3">
                  {check
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${check ? "text-gray-800" : "text-gray-400"}`}>{label}</p>
                    <p className="text-xs text-gray-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team summary */}
          {team && (
            <div className="card p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Team Summary</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Team ID", value: team.teamId, mono: true },
                  { label: "Team Name", value: team.teamName },
                  { label: "Problem Statement", value: team.problemStatementTitle || "Not selected" },
                  { label: "Team Leader", value: team.members.find((m) => m.userId === team.leaderId)?.name || "—" },
                  { label: "Team Size", value: `${memberCount} / ${eventConfig.teamMax} members` },
                  { label: "Payment", value: `${paidCount} / ${memberCount} paid` },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-bold text-gray-800 ${mono ? "font-mono text-violet-700" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" /> Submission Documents
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-500 mb-3">{doc.description}</p>
                    <div className="flex gap-2">
                      <a href={doc.path} target="_blank" rel="noopener noreferrer">
                        <Button variant="primary" size="sm">View</Button>
                      </a>
                      <a href={doc.path} download>
                        <Button variant="secondary" size="sm">Download</Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission instructions */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Submission Instructions</h2>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                "Final submission must be completed through the official submission form.",
                "Only the Team Leader should submit the team's final response.",
                "Ensure the Team ID and team details match the information registered on this platform.",
                "Use the official PPT format template for your presentation.",
                "Submissions after the deadline will not be accepted.",
              ].map((inst, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-violet-700 text-xs font-bold">{i + 1}</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Submission CTA */}
          <div className={`card p-6 ${isEligible ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}>
            <h2 className="text-base font-bold text-gray-900 mb-3">Final Submission Form</h2>

            {!isEligible ? (
              <div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
                  <Lock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Submission Access Locked</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Complete your team and wait for the Team Leader to confirm the team.
                    </p>
                  </div>
                </div>
                {!team && (
                  <Link to="/dashboard/team">
                    <Button variant="secondary" size="md" leftIcon={<Users className="w-4 h-4" />}>
                      Create or Join a Team
                    </Button>
                  </Link>
                )}
                {team && !isRound2 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Round 1: PPT Submitted</p>
                    <p className="text-sm text-amber-700">Waiting for Round 1 evaluation results. If selected, team will advance to Round 2 (Finals) where all members pay ₹200 each.</p>
                  </div>
                )}
                {team && isRound2 && !allPaidRound2 && (
                  <Link to="/dashboard/team">
                    <Button variant="secondary" size="md" leftIcon={<CreditCard className="w-4 h-4" />}>
                      Complete Payment (₹{round2Fee} each)
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Your team is eligible to submit.</p>
                    <p className="text-xs text-green-600 mt-0.5">All requirements have been met.</p>
                  </div>
                </div>

                {isLeader ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      As the Team Leader, you can now open the official submission form.
                    </p>
                    <a
                      href={eventConfig.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-lg text-sm font-semibold"
                      data-testid="submission-form-link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Submission Form
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Submission available to your team.</p>
                    <p className="text-sm text-blue-700">
                      The Team Leader must complete the final submission. Contact your Team Leader — <strong>{team?.members.find((m) => m.userId === team.leaderId)?.name}</strong> — to submit the project.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
}
