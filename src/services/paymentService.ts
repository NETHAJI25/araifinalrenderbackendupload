import type { Payment } from "../types";
import { authService } from "./authService";

const PAYMENTS_KEY = "ia2_payments";

function getPayments(): Payment[] {
  const raw = localStorage.getItem(PAYMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Payment[];
  } catch {
    return [];
  }
}

function savePayments(payments: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export const paymentService = {
  async createPayment(): Promise<Payment> {
    await new Promise((r) => setTimeout(r, 1000));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const payments = getPayments();
    const existing = payments.find((p) => p.userId === user.id && p.status === "paid");
    if (existing) throw new Error("Payment already completed");

    const payment: Payment = {
      id: `pay_${Date.now()}`,
      userId: user.id,
      amount: 200,
      currency: "INR",
      status: "processing",
      reference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    payments.push(payment);
    savePayments(payments);

    // Simulate async payment verification
    setTimeout(() => {
      const all = getPayments();
      const p = all.find((x) => x.id === payment.id);
      if (p) {
        p.status = "paid";
        p.reference = `REF${Date.now()}`;
        p.updatedAt = new Date().toISOString();
        savePayments(all);
        authService.updateCurrentUser({ paymentStatus: "paid" });
      }
    }, 2000);

    return payment;
  },

  async verifyPayment(paymentId: string): Promise<Payment> {
    await new Promise((r) => setTimeout(r, 500));
    const payments = getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("Payment not found");
    return payment;
  },

  async getMyPayment(): Promise<Payment | null> {
    await new Promise((r) => setTimeout(r, 300));
    const user = authService.getCurrentUser();
    if (!user) return null;
    const payments = getPayments();
    return payments.find((p) => p.userId === user.id) || null;
  },

  async mockCompletePay(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1500));
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const payments = getPayments();
    const existing = payments.find((p) => p.userId === user.id);
    if (existing) {
      existing.status = "paid";
      existing.reference = `REF${Date.now()}`;
      existing.updatedAt = new Date().toISOString();
    } else {
      payments.push({
        id: `pay_${Date.now()}`,
        userId: user.id,
        amount: 200,
        currency: "INR",
        status: "paid",
        reference: `REF${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    savePayments(payments);
    authService.updateCurrentUser({ paymentStatus: "paid" });
  },
};
