import { useState, useEffect } from "react";
import { Search, Ban, Mail, Eye, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types";

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<1 | 2 | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const teamsData = await teamService.getAll();
      setTeams(teamsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
    const matchesRound = roundFilter === "all" || String(t.round ?? 1) === roundFilter;
    return matchesQuery && matchesFilter && matchesRound;
  });

  function toggleSelect(teamId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const allSelected = filteredTeams.length > 0 && filteredTeams.every((t) => prev.has(t.teamId));
      if (allSelected) return new Set();
      return new Set(filteredTeams.map((t) => t.teamId));
    });
  }

  async function handleBulkRound(round: 1 | 2) {
    const targets = teams.filter((t) => selected.has(t.teamId) && (t.round ?? 1) !== round);
    if (targets.length === 0) {
      setSelected(new Set());
      return;
    }
    setBulkLoading(round);
    try {
      await Promise.all(targets.map((t) => teamService.updateTeamRound(t.teamId, round)));
      setSelected(new Set());
      await loadData();
    } catch (error) {
      console.error("Failed to update team rounds:", error);
      alert("Failed to update some teams. Please try again.");
      await loadData();
    } finally {
      setBulkLoading(null);
    }
  }

  const allVisibleSelected =
    filteredTeams.length > 0 && filteredTeams.every((t) => selected.has(t.teamId));

  const colCount = 9;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Teams</h1>
          <p className="text-gray-500 text-sm mt-1">View teams and advance finalists from Round 1 to Round 2.</p>
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
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Rounds</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-sm font-semibold text-violet-800">
            {selected.size} team{selected.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2"
            >
              Clear
            </button>
            <button
              onClick={() => handleBulkRound(2)}
              disabled={bulkLoading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {bulkLoading === 2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              Promote to Round 2
            </button>
            <button
              onClick={() => handleBulkRound(1)}
              disabled={bulkLoading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {bulkLoading === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownRight className="w-4 h-4" />}
              Move to Round 1
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all teams"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th className="px-5 py-3">Team</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Problem Statement</th>
                <th className="px-5 py-3">Round</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Team Status</th>
                <th className="px-5 py-3">Round 1 Fee</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-gray-500">
                    No teams found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const teamRound = team.round ?? 1;
                  const leaderPaidRound1 = (team.members.find(m => m.userId === team.leaderId)?.paidRounds ?? []).includes(1);
                  return (
                    <tr key={team.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/admin/teams/${team.teamId}`)}>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${team.teamName}`}
                          checked={selected.has(team.teamId)}
                          onChange={() => toggleSelect(team.teamId)}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          teamRound === 2
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-violet-50 text-violet-700 border-violet-200'
                        }`}>
                          Round {teamRound}
                        </span>
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
                            leaderPaidRound1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {leaderPaidRound1 ? "Paid ₹100" : "Unpaid"}
                          </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {teamRound === 1 ? (
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Promote to Round 2"
                              onClick={() => teamService.updateTeamRound(team.teamId, 2).then(loadData).catch(() => alert("Failed to promote team"))}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Move back to Round 1"
                              onClick={() => teamService.updateTeamRound(team.teamId, 1).then(loadData).catch(() => alert("Failed to move team"))}
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>
                          )}
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
