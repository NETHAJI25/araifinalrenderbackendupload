import { useState, useEffect } from "react";
import {
  CreditCard, Search, IndianRupee, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { paymentService } from "../../services/cashfreeService";
import { ErrorState } from "../../components/ui/EmptyState";
import type { AdminPayment, PaymentSummary } from "../../types";

const EMPTY_SUMMARY: PaymentSummary = {
  total: 0, paid: 0, pending: 0, failed: 0,
  totalCollected: 0, round1Collected: 0, round2Collected: 0,
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-50 text-green-700 border-green-200",
  verified: "bg-green-50 text-green-700 border-green-200",
  created: "bg-amber-50 text-amber-700 border-amber-200",
  initiated: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatCurrency(value: number) {
  return `₹${(value || 0).toLocaleString("en-IN")}`;
}

// Cashfree can report the method either as a string ("upi") or as an object
// keyed by method ({ upi: { channel, upi_id } }). Never render a raw object —
// React throws "Objects are not valid as a React child".
function formatMethod(method: unknown): string {
  if (typeof method === "string") return method || "—";
  if (method && typeof method === "object") {
    const keys = Object.keys(method as Record<string, unknown>);
    return keys.length ? keys.join(", ") : "—";
  }
  return "—";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");

  async function fetchPayments() {
    const { payments: rows, summary: s } = await paymentService.getAllPayments();
    setPayments(rows);
    setSummary(s);
  }

  // Used by the retry button (event handler — safe to set state synchronously).
  async function reload() {
    setIsLoading(true);
    setLoadError("");
    try {
      await fetchPayments();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Initial load: `isLoading` already starts true, so only update state
    // after the async request settles (avoids synchronous setState in effect).
    (async () => {
      try {
        await fetchPayments();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load payments");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = payments.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.userName.toLowerCase().includes(q) ||
      (p.userEmail || "").toLowerCase().includes(q) ||
      (p.orderId || "").toLowerCase().includes(q) ||
      (p.cfOrderId || "").toLowerCase().includes(q) ||
      (p.teamName || "").toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && (p.status === "paid" || p.status === "verified")) ||
      (statusFilter === "pending" && ["created", "initiated", "processing", "pending"].includes(p.status)) ||
      (statusFilter === "failed" && ["failed", "expired"].includes(p.status));
    const matchesRound =
      roundFilter === "all" || String(p.round ?? 1) === roundFilter;
    return matchesQuery && matchesStatus && matchesRound;
  });

  const statCards = [
    { label: "Total Collected", value: formatCurrency(summary.totalCollected), icon: <IndianRupee className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50" },
    { label: "Paid", value: summary.paid, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Pending", value: summary.pending, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Failed / Expired", value: summary.failed, icon: <XCircle className="w-5 h-5 text-red-600" />, bg: "bg-red-50" },
    { label: "Round 1 Collected", value: formatCurrency(summary.round1Collected), icon: <IndianRupee className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Round 2 Collected", value: formatCurrency(summary.round2Collected), icon: <IndianRupee className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">All Cashfree transactions across rounds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search name, email, order..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-9 text-sm w-full sm:w-64"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field text-sm">
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)} className="input-field text-sm">
            <option value="all">All Rounds</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={reload} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">Participant</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-5 py-3">Round</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center text-violet-400">
                          <CreditCard className="w-7 h-7" />
                        </div>
                        <p className="text-gray-500">
                          {payments.length === 0 ? "No payments recorded yet." : "No payments match your filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{p.userName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.userEmail || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        {p.teamName ? (
                          <span className="text-gray-700">{p.teamName}</span>
                        ) : (
                          <span className="text-gray-400 italic">No team</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">
                          Round {p.round ?? 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[p.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-600 break-all">{p.orderId || "—"}</span>
                        {p.cfOrderId && (
                          <p className="font-mono text-[10px] text-gray-400 mt-0.5">cf: {p.cfOrderId}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600 capitalize">{formatMethod(p.method)}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
