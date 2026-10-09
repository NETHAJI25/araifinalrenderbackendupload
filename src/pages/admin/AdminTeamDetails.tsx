import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { teamService } from "../../services/teamService";
import { submissionService } from "../../services/submissionService";
import { mockUsers } from "../../data/mockUsers";
import type { Team, Submission } from "../../types";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";

export default function AdminTeamDetails() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      if (!teamId) return;
      try {
        const [data, submissions] = await Promise.all([
           teamService.getTeam(teamId),
           submissionService.getAll()
        ]);
        setTeam(data);
        setSubmission(submissions.find(s => s.teamId === teamId) || null);
      } catch (err) {
        addToast({ type: "error", title: "Failed to load team" });
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [teamId, addToast]);

  const handleReject = async () => {
    if (!teamId || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      const updatedTeam = await teamService.rejectTeam(teamId, rejectReason);
      setTeam(updatedTeam);
      setRejectModalOpen(false);
      addToast({ type: "success", title: "Team rejected successfully" });
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to reject team" });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading team details...</div>;
  if (!team) return <div className="p-8 text-center text-red-500 font-medium">Team not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/teams")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight flex items-center gap-3">
              {team.teamName}
              {team.status === "rejected" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-700">
                  Rejected
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Team ID: {team.teamId}</p>
          </div>
        </div>
        {team.status !== "rejected" && (
          <Button variant="secondary" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setRejectModalOpen(true)}>
            Reject Team
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" /> Members ({team.members.length}/6)
            </h2>
            <div className="space-y-4">
              {team.members.map((m) => {
                const userExt = mockUsers.find(u => u.id === m.userId);
                return (
                  <div key={m.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
                    <div>
                      <p className="font-bold text-gray-900">{m.name} <span className="text-xs font-normal text-gray-500 ml-2">{userExt?.email || 'N/A'}</span></p>
                      <p className="text-sm text-gray-600 mt-1">{m.college}</p>
                      <p className="text-xs text-gray-500">{userExt?.course || 'Course N/A'}, {userExt?.year || 'Year N/A'}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${m.role === 'Team Leader' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-700'}`}>{m.role}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${m.paymentStatus === "paid" || m.paymentStatus === "verified" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {m.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Rejection Reason */}
          {team.status === "rejected" && team.rejectionReason && (
            <div className="card p-6 border-red-200 bg-red-50">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Rejection Reason
              </h3>
              <p className="text-sm text-red-700">{team.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Problem Statement */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Problem Statement</h2>
            {team.problemStatementId ? (
              <div>
                <p className="text-xl font-black text-violet-700 mb-1">{team.problemStatementId}</p>
                <p className="text-sm text-gray-700 font-medium">{team.problemStatementTitle}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Not selected yet</p>
            )}
          </div>

          {/* Status */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Status Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Confirmation</span>
                <span className={`font-semibold flex items-center gap-1 ${team.confirmationStatus === "confirmed" ? "text-green-600" : "text-amber-600"}`}>
                  {team.confirmationStatus === "confirmed" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {team.confirmationStatus}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Submission</span>
                <span className={`font-semibold flex items-center gap-1 ${submission ? "text-blue-600" : "text-gray-500"}`}>
                  {submission ? submission.status : "Pending"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Payment Summary</span>
                <span className="font-semibold text-gray-900">
                  {team.members.filter(m => m.paymentStatus === 'paid' || m.paymentStatus === 'verified').length} / {team.members.length} Paid
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setRejectModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Team</h3>
              <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this team. This action cannot be easily undone.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm mb-4 min-h-[100px] resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleReject} loading={rejecting} disabled={!rejectReason.trim()}>
                  Reject Team
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
