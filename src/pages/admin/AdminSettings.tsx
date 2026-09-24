import { eventConfig } from "../../config/eventConfig";
import { useAuth } from "../../contexts/AuthContext";
import { Badge } from "../../components/ui/Badge";

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Account Details</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-semibold text-gray-900">Email:</span> {user?.email}</p>
            <p><span className="font-semibold text-gray-900">Role:</span> <Badge variant="violet">{user?.role}</Badge></p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Event Configuration</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-semibold text-gray-900">Hackathon Name:</span> {eventConfig.hackathonName}</p>
            <p><span className="font-semibold text-gray-900">Contact Email:</span> {eventConfig.contactEmail}</p>
            <p><span className="font-semibold text-gray-900">Registration Fee:</span> ₹{eventConfig.registrationFee}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
