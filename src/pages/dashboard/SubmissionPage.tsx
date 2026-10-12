import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, ExternalLink, FileText, Lock, Users, CreditCard, Trophy } from "lucide-react";
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
  const round1Fee = 100; // Round 1 leader fee
  const teamIsComplete = team?.status === "complete" || team?.confirmationStatus === "confirmed";
  const hasValidSize = memberCount >= eventConfig.teamMin && memberCount <= eventConfig.teamMax;

  // Round 1 submission is unlocked once the Team Leader has paid the ₹100 fee.
  const leaderPaidRound1 = (team?.members.find((m) => m.userId === team?.leaderId)?.paidRounds ?? []).includes(1);
  const canSubmit = !!team && !isRound2 && teamIsComplete && leaderPaidRound1;

  const paidCount = (team?.members ?? []).filter((m) => (m.paidRounds ?? []).includes(isRound2 ? 2 : 1)).length;

  const checks = [
    { check: !!team, label: "Team created", detail: team ? team.teamName : "No team found" },
    { check: hasValidSize, label: `Team size ${eventConfig.teamMin}–${eventConfig.teamMax} members`, detail: `${memberCount} member(s)` },
    { check: teamIsComplete, label: "Team marked complete", detail: teamIsComplete ? "Complete" : "Ask your Team Leader to complete the team" },
    { check: leaderPaidRound1, label: `Leader paid ₹${round1Fee} (Round 1)`, detail: leaderPaidRound1 ? "Paid — form unlocked" : "Pending" },
  ];

  return (
    <>
      <title>{`Submission | ${eventConfig.hackathonName}`}</title>

      <div className="mb-8">
        <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">
          {isRound2 ? "Round 2 · Finals" : "Round 1 Submission"}
        </p>
        <h1 className="text-2xl font-black text-gray-900">Project Submission</h1>
        <p className="text-sm text-gray-500 mt-1">
          Only the Team Leader can submit the Round 1 project form.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Requirements checklist */}
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
                  isRound2
                    ? { label: "Round 2 Payments", value: `${paidCount} / ${memberCount} paid` }
                    : { label: "Round 1 Fee", value: leaderPaidRound1 ? "Paid ✓" : "Pending" },
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
                "Round 1 submission is completed through the official submission form linked below.",
                "Only the Team Leader should submit the team's response.",
                "Ensure the Team ID and team details match the information registered on this platform.",
                "Use the official PPT format template for your presentation.",
                "Submissions after the deadline will not be accepted.",
                "Teams selected in Round 1 advance to Round 2 (Finals).",
              ].map((inst, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-violet-700 text-xs font-bold">{i + 1}</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Submission CTA */}
          <div className={`card p-6 ${canSubmit ? "border-green-200 bg-green-50/30" : isRound2 ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              {isRound2 ? "Round 2 (Finals)" : "Round 1 Submission Form"}
            </h2>

            {isRound2 ? (
              /* Round 2 is the offline finals — no online submission required */
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-600 shrink-0" /> Your team advanced to Round 2 (Finals)!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Round 1 project submission is now closed. Round 2 is the offline final round — no further
                  online submission is needed here. Watch the Announcements page for finals details.
                </p>
              </div>
            ) : canSubmit ? (
              isLeader ? (
                <div>
                  <div className="flex items-center gap-3 mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-800">Your team can submit the Round 1 project.</p>
                      <p className="text-xs text-green-600 mt-0.5">Payment received — the submission form is unlocked.</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    As the Team Leader, open the official submission form to add your project details.
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
                    Only the Team Leader can open the submission form. Contact your Team Leader — <strong>{team?.members.find((m) => m.userId === team.leaderId)?.name}</strong> — to submit the project.
                  </p>
                </div>
              )
            ) : (
              <div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
                  <Lock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Submission Access Locked</p>
                    <p className="text-sm text-gray-500 mt-1">
                      The Team Leader must complete the team and pay the ₹{round1Fee} Round 1 fee to unlock the submission form.
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
                {team && isLeader && (
                  <Link to="/dashboard/team">
                    <Button variant="secondary" size="md" leftIcon={<CreditCard className="w-4 h-4" />}>
                      Complete Payment (₹{round1Fee}) on My Team
                    </Button>
                  </Link>
                )}
                {team && !isLeader && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Waiting for your Team Leader.</p>
                    <p className="text-sm text-blue-700">
                      The Team Leader pays ₹{round1Fee} and submits the project for Round 1 evaluation.
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
