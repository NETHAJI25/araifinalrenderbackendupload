import React from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "ghost" | "outline" | "primary-dark" | "outline-white" | "solid-white";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-violet-700 text-white hover:bg-violet-800 focus:ring-violet-500 border-2 border-violet-700",
  secondary:
    "bg-white text-violet-700 border-2 border-violet-700 hover:bg-violet-50 focus:ring-violet-500",
  tertiary:
    "bg-transparent text-violet-700 border border-transparent hover:bg-violet-50 focus:ring-violet-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-red-600",
  ghost:
    "bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 focus:ring-gray-400",
  outline:
    "bg-white text-violet-700 border-2 border-violet-700 hover:bg-violet-700 hover:text-white focus:ring-violet-500",
  "primary-dark":
    "bg-violet-900 text-white hover:bg-violet-950 focus:ring-violet-700 border-2 border-violet-900",
  "outline-white":
    "bg-transparent text-white border-2 border-white hover:bg-white hover:text-violet-700 focus:ring-white",
  "solid-white":
    "bg-white text-violet-700 border-2 border-white hover:bg-gray-50 focus:ring-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2.5 text-sm gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
