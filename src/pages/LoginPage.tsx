import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { IALogoMark } from "../components/ui/IALogo";
import { authService } from "../services/authService";
import { eventConfig } from "../config/eventConfig";
import Seo from "../components/seo/Seo";

interface FormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password (mobile number or email + on-screen OTP)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"phone" | "reset">("phone");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  function resetForgotState() {
    setForgotStep("phone");
    setForgotIdentifier("");
    setGeneratedOtp("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirm("");
    setForgotLoading(false);
  }

  function closeForgot() {
    setForgotOpen(false);
    resetForgotState();
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    const identifier = forgotIdentifier.trim();
    if (!identifier) {
      addToast({ type: "error", title: "Required", message: "Please enter your registered mobile number or email." });
      return;
    }
    setForgotLoading(true);
    try {
      const otp = await authService.sendOTP(identifier);
      setGeneratedOtp(otp);
      setForgotStep("reset");
      addToast({ type: "success", title: "OTP generated", message: "Enter the OTP shown below to reset your password." });
    } catch (err) {
      addToast({
        type: "error",
        title: "Couldn't generate OTP",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    const identifier = forgotIdentifier.trim();
    if (!forgotOtp.trim()) {
      addToast({ type: "error", title: "OTP required", message: "Please enter the OTP." });
      return;
    }
    if (forgotNewPassword.length < 6) {
      addToast({ type: "error", title: "Password too short", message: "Password must be at least 6 characters." });
      return;
    }
    if (forgotNewPassword !== forgotConfirm) {
      addToast({ type: "error", title: "Passwords don't match", message: "Please re-enter both passwords." });
      return;
    }
    setForgotLoading(true);
    try {
      await authService.resetPassword(identifier, forgotOtp.trim(), forgotNewPassword);
      addToast({ type: "success", title: "Password updated", message: "You can now sign in with your new password." });
      closeForgot();
    } catch (err) {
      addToast({
        type: "error",
        title: "Reset failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      addToast({ type: "success", title: "Welcome back!", message: "You are now signed in." });
      
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      addToast({ type: "error", title: "Login failed", message: err instanceof Error ? err.message : "Please check your credentials and try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Seo
        title={`Login | ${eventConfig.hackathonName}`}
        description={`Sign in to your ${eventConfig.hackathonName} account to manage your team, pay round fees and view problem statements.`}
        path="/login"
        noindex
      />
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-6 sm:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <IALogoMark size={48} />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Welcome Back</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to your {eventConfig.hackathonName} account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                error={errors.email?.message}
                {...register("email", { required: "Email is required" })}
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register("password", { required: "Password is required" })}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500" {...register("rememberMe")} />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-violet-700 hover:underline font-medium focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full"
                leftIcon={<LogIn className="w-4 h-4" />}>
                Sign In
              </Button>
            </form>

            

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-violet-700 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={forgotOpen}
        onClose={closeForgot}
        title={forgotStep === "phone" ? "Reset your password" : "Enter OTP & new password"}
        size="sm"
      >
        {forgotStep === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <p className="text-sm text-gray-500">
              Enter the mobile number or email you registered with. We'll generate an OTP to verify it's you.
            </p>
            <Input
              label="Mobile Number or Email"
              type="text"
              placeholder="e.g. 9876543210 or you@example.com"
              required
              value={forgotIdentifier}
              onChange={(e) => setForgotIdentifier(e.target.value)}
            />
            <Button type="submit" variant="primary" size="lg" loading={forgotLoading} className="w-full">
              Generate OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Your OTP</p>
              <p className="mt-1 text-2xl font-black tracking-[0.3em] text-violet-800">{generatedOtp}</p>
              <p className="mt-1 text-xs text-violet-600">Valid for 10 minutes</p>
            </div>

            <Input
              label="OTP"
              inputMode="numeric"
              placeholder="Enter the 6-digit OTP"
              required
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              required
              autoComplete="new-password"
              value={forgotConfirm}
              onChange={(e) => setForgotConfirm(e.target.value)}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => { setForgotStep("phone"); setForgotOtp(""); }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                ← Change number/email
              </button>
              <Button type="submit" variant="primary" loading={forgotLoading} className="px-5">
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
