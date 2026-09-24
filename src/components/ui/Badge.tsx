import React from "react";

type BadgeVariant = "violet" | "blue" | "green" | "amber" | "red" | "gray" | "navy";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  violet: "bg-violet-100 text-violet-800 border border-violet-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  green: "bg-green-100 text-green-800 border border-green-200",
  amber: "bg-amber-100 text-amber-800 border border-amber-200",
  red: "bg-red-100 text-red-800 border border-red-200",
  gray: "bg-gray-100 text-gray-700 border border-gray-200",
  navy: "bg-indigo-100 text-indigo-800 border border-indigo-200",
};

export function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface DifficultyBadgeProps {
  difficulty: "Easy" | "Medium" | "Hard";
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const map = {
    Easy: "green",
    Medium: "amber",
    Hard: "red",
  } as const;
  return <Badge variant={map[difficulty]}>{difficulty}</Badge>;
}
