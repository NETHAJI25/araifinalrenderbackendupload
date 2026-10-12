import type { Payment, AdminPayment, PaymentSummary } from "../types";
import { authService } from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "https://araifinalrenderbackendupload.onrender.com";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authService.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }

  return data;
}

export const paymentService = {
  async createPaymentOrder(amount: number, round: number = 1): Promise<{
    paymentId: string;
    orderId: string;
    cfOrderId: string;
    paymentSessionId: string;
    amount: number;
    currency: string;
    returnUrl: string;
  }> {
    const response = await fetchWithAuth("/api/payments/order", {
      method: "POST",
      body: JSON.stringify({ amount, round }),
    });
    return response.data;
  },

  async getPaymentStatus(orderId: string): Promise<Payment> {
    const response = await fetchWithAuth(`/api/payments/${orderId}`);
    return response.data;
  },

  async getMyPayments(): Promise<Payment[]> {
    const response = await fetchWithAuth("/api/payments/my");
    return response.data;
  },

  // Admin-only: every payment enriched with user + team info, plus totals.
  async getAllPayments(): Promise<{ payments: AdminPayment[]; summary: PaymentSummary }> {
    const response = await fetchWithAuth("/api/payments/admin/all");
    return response.data;
  },

  async verifyPayment(orderId: string): Promise<Payment> {
    const response = await fetchWithAuth("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    return response.data;
  },

  async getPaymentSessionId(orderId: string): Promise<string | null> {
    try {
      const payment = await this.getPaymentStatus(orderId);
      return payment.paymentSessionId || null;
    } catch {
      return null;
    }
  },
};

export const cashfreeConfig = {
  appId: import.meta.env.VITE_CASHFREE_APP_ID || "143960040b46d8019d94d4b22e20069341",
  environment: import.meta.env.VITE_CASHFREE_ENV === "SANDBOX" ? "SANDBOX" : "PRODUCTION",
};