import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, UsersIcon, CheckCircle, Clock, AlertTriangle, UserCheck, XCircle, CreditCard } from "lucide-react";
import { teamService } from "../../services/teamService";
import type { Team } from "../../types";

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalTeams: 0,
    completedTeams: 0,
    pendingTeams: 0,
    rejectedTeams: 0,
    paidParticipants: 0,
    pendingPayments: 0,
    round1FeePaid: 0,
  });
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const teams = await teamService.getAll();
        
        let participantsCount = 0;
        let pendingCount = 0;
        let paidCount = 0;
        let round1PaidCount = 0;
        
        teams.forEach(team => {
          participantsCount += team.members.length;
          const leader = team.members.find(m => m.userId === team.leaderId);
          if ((leader?.paidRounds ?? []).includes(1)) round1PaidCount++;
          team.members.forEach(m => {
            if (m.paymentStatus === 'pending') pendingCount++;
            if (m.paymentStatus === 'paid' || m.paymentStatus === 'verified') paidCount++;
          });
        });

        setStats({
          totalParticipants: participantsCount,
          totalTeams: teams.length,
          completedTeams: teams.filter(t => t.confirmationStatus === 'confirmed').length,
          pendingTeams: teams.filter(t => t.status === 'active' && t.confirmationStatus !== 'confirmed').length,
          rejectedTeams: teams.filter(t => t.status === 'rejected').length,
          paidParticipants: paidCount,
          pendingPayments: pendingCount,
          round1FeePaid: round1PaidCount,
        });

        setRecentTeams(
          teams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
        );
      } catch (error) {
        console.error("Failed to load admin overview:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    { label: "Total Participants", value: stats.totalParticipants, icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Total Teams", value: stats.totalTeams, icon: <UsersIcon className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50" },
    { label: "Completed Teams", value: stats.completedTeams, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Pending Teams", value: stats.pendingTeams, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Rejected Teams", value: stats.rejectedTeams, icon: <XCircle className="w-5 h-5 text-red-600" />, bg: "bg-red-50" },
    { label: "Paid Participants", value: stats.paidParticipants, icon: <UserCheck className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
    { label: "Pending Payments", value: stats.pendingPayments, icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50" },
    { label: "Round 1 Fee Paid", value: stats.round1FeePaid, icon: <CreditCard className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of hackathon registrations and statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Teams</h2>
          <Link to="/admin/teams" className="text-sm text-violet-700 font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Team Name</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTeams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    No teams registered yet.
                  </td>
                </tr>
              ) : (
                recentTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{team.teamName}</td>
                    <td className="px-5 py-3 text-gray-500">{team.members.length}/6</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        team.confirmationStatus === 'confirmed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {team.confirmationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(team.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
