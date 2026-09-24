import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { mockUsers } from "../../data/mockUsers";
import { teamService } from "../../services/teamService";

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const loadParticipants = async () => {
      const teams = await teamService.getAll();
      
      const combinedParticipants = mockUsers.map(user => {
        const team = teams.find(t => t.members.some(m => m.userId === user.id));
        const memberData = team?.members.find(m => m.userId === user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          college: user.college,
          course: user.course,
          year: user.year,
          role: user.role, // App role (admin/participant)
          teamRole: memberData?.role || "N/A",
          teamName: team?.teamName || "No Team",
          teamId: team?.teamId || "N/A",
          problemStatement: team?.problemStatementTitle || "N/A",
          paymentStatus: user.paymentStatus,
          status: user.profileCompleted ? "Profile Complete" : "Incomplete",
          submissionEligibility: team?.confirmationStatus === 'confirmed' ? "Eligible" : "Not Eligible"
        };
      });
      
      setParticipants(combinedParticipants);
    };

    loadParticipants();
  }, []);

  const filtered = participants.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.email.toLowerCase().includes(query.toLowerCase()) ||
      p.college.toLowerCase().includes(query.toLowerCase()) ||
      p.teamName.toLowerCase().includes(query.toLowerCase());
      
    const matchesPayment = paymentFilter === "All" || p.paymentStatus.toLowerCase() === paymentFilter.toLowerCase();
    const matchesTeam = teamFilter === "All" || 
      (teamFilter === "Has Team" && p.teamName !== "No Team") ||
      (teamFilter === "No Team" && p.teamName === "No Team");
    const matchesRole = roleFilter === "All" || p.teamRole.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesQuery && matchesPayment && matchesTeam && matchesRole;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Participants</h1>
          <p className="text-gray-500 text-sm mt-1">View all registered users.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="search" 
              placeholder="Search name, email, college, team..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-9 text-sm w-full sm:w-64"
            />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field text-sm">
            <option value="All">Payment: All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="input-field text-sm">
            <option value="All">Team: All</option>
            <option value="Has Team">Has Team</option>
            <option value="No Team">No Team</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field text-sm">
            <option value="All">Role: All</option>
            <option value="Leader">Leader</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">College</th>
                <th className="px-5 py-3">Team Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Payment Status</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-700 max-w-[200px] truncate" title={user.college}>{user.college}</td>
                  <td className="px-5 py-4 text-gray-700 max-w-[200px] truncate" title={user.teamName}>{user.teamName}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      user.paymentStatus === 'verified' || user.paymentStatus === 'paid'
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {user.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'Profile Complete' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="text-primary hover:text-primary-dark font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal for Details */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                ✕
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Participant Details</h3>
              <div className="space-y-3 text-sm">
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Full Name</span>
                    <span className="col-span-2 text-gray-900 font-semibold">{selectedUser.name}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.email}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">College</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.college}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Course/Year</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.course}, {selectedUser.year}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Team Name</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.teamName}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Team ID</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.teamId}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Team Role</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.teamRole}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Problem Stmt</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.problemStatement}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Payment Status</span>
                    <span className="col-span-2 text-gray-900 uppercase font-bold">{selectedUser.paymentStatus}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Registration Status</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.status}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Submission Elig.</span>
                    <span className="col-span-2 text-gray-900">{selectedUser.submissionEligibility}</span>
                 </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedUser(null)} className="btn btn-primary py-2 px-6">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
