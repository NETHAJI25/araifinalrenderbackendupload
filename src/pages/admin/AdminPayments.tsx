import { CreditCard } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AdminPayments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      </div>
      <EmptyState icon={<CreditCard />} title="No Payments" description="Payment integration is coming soon." />
    </div>
  );
}
