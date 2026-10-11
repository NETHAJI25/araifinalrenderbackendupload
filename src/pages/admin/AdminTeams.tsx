import { useState, useEffect } from "react";
import { Search, Ban, Mail, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { teamService } from "../../services/teamService";
import { submissionService } from "../../services/submissionService";
import type { Team, Submission } from "../../types";

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [teamsData, submissionsData] = await Promise.all([
        teamService.getAll(),
        submissionService.getAll()
      ]);
      setTeams(teamsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject(teamId: string) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    
    try {
      await teamService.rejectTeam(teamId, reason);
      loadData();
    } catch (error) {
      console.error("Failed to reject team:", error);
      alert("Failed to reject team");
    }
  }

  const filteredTeams = teams.filter((t) => {
    const matchesQuery = t.teamName.toLowerCase().includes(query.toLowerCase()) || 
                         t.teamId.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || 
                          (filter === "confirmed" && t.confirmationStatus === "confirmed") ||
                          (filter === "pending" && t.confirmationStatus === "pending") ||
                          (filter === "rejected" && t.status === "rejected");
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Teams</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all registered teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="search" 
              placeholder="Search teams..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-9 text-sm w-full sm:w-64"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Teams</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Team</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Problem Statement</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Team Status</th>
                <th className="px-5 py-3">Submission Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No teams found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const hasSubmitted = submissions.some(s => s.teamId === team.teamId);
                  return (
                    <tr key={team.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/admin/teams/${team.teamId}`)}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-violet-700 hover:underline">{team.teamName}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{team.teamId}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{team.members.length}/6</p>
                        <p className="text-xs text-gray-500 mt-0.5">{team.members.find(m => m.role === 'Team Leader')?.name || 'No Leader'}</p>
                      </td>
                      <td className="px-5 py-4">
                        {team.problemStatementId ? (
                          <>
                            <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{team.problemStatementTitle}</p>
                            <p className="text-xs text-violet-600 font-mono mt-0.5">{team.problemStatementId}</p>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Not selected</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-green-700">Paid: {team.members.filter(m => m.paymentStatus === 'paid' || m.paymentStatus === 'verified').length}</span>
                          <span className="text-xs font-medium text-amber-700">Pending: {team.members.filter(m => m.paymentStatus === 'pending').length}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {team.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                            Rejected
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            team.confirmationStatus === 'confirmed' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {team.confirmationStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            hasSubmitted ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {hasSubmitted ? "Submitted" : "Pending"}
                          </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/teams/${team.teamId}`}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Contact Team Leader"
                            onClick={() => alert(`Emailing leader... (Mock)`)}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          {team.status !== 'rejected' && (
                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Team"
                              onClick={() => handleReject(team.teamId)}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
