import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IALogoMark } from "../components/ui/IALogo";
import { eventConfig } from "../config/eventConfig";

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

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

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
    } catch {
      addToast({ type: "error", title: "Login failed", message: "Please check your credentials and try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <title>{`Login | ${eventConfig.hackathonName}`}</title>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 shadow-lg">
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
                <button type="button" className="text-sm text-violet-700 hover:underline font-medium focus:outline-none">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full"
                leftIcon={<LogIn className="w-4 h-4" />}>
                Sign In
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 font-medium text-center">
                Demo mode: enter any email and password to sign in
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-violet-700 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
