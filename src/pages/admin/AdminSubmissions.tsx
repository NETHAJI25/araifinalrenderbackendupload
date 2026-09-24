import { Send } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AdminSubmissions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
      </div>
      <EmptyState icon={<Send />} title="No Submissions" description="Project submissions will appear here once the deadline approaches." />
    </div>
  );
}
