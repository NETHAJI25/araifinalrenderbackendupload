import { useState, useEffect } from "react";
import { X, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { paymentService, cashfreeConfig } from "../../services/cashfreeService";

interface CashfreePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  amount: number;
  orderId: string;
  paymentSessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

export function CashfreePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  amount,
  orderId,
  paymentSessionId,
  customerName,
  customerEmail,
  customerPhone,
}: CashfreePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !sdkLoaded) {
      loadCashfreeSDK();
    }
  }, [isOpen, sdkLoaded]);

  const loadCashfreeSDK = () => {
    if (window.Cashfree) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = cashfreeConfig.environment === "PRODUCTION"
      ? "https://sdk.cashfree.com/js/v3/cashfree.js"
      : "https://sdk.cashfree.com/js/v3/cashfree.sandbox.js";
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      setError("Failed to load Cashfree SDK");
    };
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (!window.Cashfree) {
      onError("Cashfree SDK not loaded. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cashfree = new window.Cashfree({
        mode: cashfreeConfig.environment === "PRODUCTION" ? "production" : "sandbox",
      });

      const checkoutOptions = {
        paymentSessionId,
        redirect: true,
        callback: async (response: any) => {
          if (response.status === "SUCCESS") {
            try {
              const verified = await paymentService.verifyPayment(orderId);
              onSuccess(verified);
            } catch (verifyError) {
              onError("Payment verification failed. Please contact support.");
            }
          } else if (response.status === "PENDING") {
            try {
              const verified = await paymentService.verifyPayment(orderId);
              if (verified.status === "paid") {
                onSuccess(verified);
              } else {
                onError("Payment is still pending. Please check again later.");
              }
            } catch (verifyError) {
              onError("Payment verification failed. Please check your payment status.");
            }
          } else {
            onError(response.message || "Payment failed. Please try again.");
          }
        },
      };

      cashfree.checkout(checkoutOptions);
    } catch (err) {
      console.error("Cashfree checkout error:", err);
      setError(err instanceof Error ? err.message : "Payment initialization failed");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Payment Gateway</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Registration Fee</span>
                <span className="font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono text-xs text-gray-900 truncate max-w-[120px]">{orderId}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Customer Details</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900 truncate max-w-[120px]">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{customerPhone}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You will be redirected to Cashfree secure payment page to complete the payment.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              onClick={handlePayment}
              disabled={!sdkLoaded}
            >
              {loading ? "Processing..." : `Pay ₹${amount.toLocaleString()}`}
            </Button>

            {!sdkLoaded && !loading && (
              <Button variant="secondary" size="sm" className="w-full" onClick={loadCashfreeSDK}>
                Retry Loading Payment Gateway
              </Button>
            )}

            <Button variant="ghost" size="sm" className="w-full" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}