export function formatDate(iso: string): string {
  if (!iso || iso.includes("PLACEHOLDER")) return iso;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function profileCompletionPercent(user: {
  name: string;
  phone: string;
  college: string;
  course: string;
  year: string;
  city: string;
  state: string;
}): number {
  const fields = [user.name, user.phone, user.college, user.course, user.year, user.city, user.state];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export function paymentStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Payment Required", color: "text-amber-600 bg-amber-50 border-amber-200" },
    processing: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200" },
    paid: { label: "Paid", color: "text-green-700 bg-green-50 border-green-200" },
    failed: { label: "Payment Failed", color: "text-red-600 bg-red-50 border-red-200" },
    verified: { label: "Verified", color: "text-green-700 bg-green-50 border-green-200" },
  };
  return map[status] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
}

export function teamStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending Confirmation", color: "text-amber-600 bg-amber-50 border-amber-200" },
    ready: { label: "Ready to Confirm", color: "text-blue-600 bg-blue-50 border-blue-200" },
    confirmed: { label: "Confirmed", color: "text-green-700 bg-green-50 border-green-200" },
  };
  return map[status] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
}
