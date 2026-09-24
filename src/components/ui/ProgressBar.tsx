interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showPercent?: boolean;
  color?: "violet" | "green" | "blue" | "amber";
  size?: "sm" | "md";
}

const colorClasses = {
  violet: "bg-violet-600",
  green: "bg-green-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
};

const heightClasses = {
  sm: "h-1.5",
  md: "h-2.5",
};

export function ProgressBar({
  value,
  label,
  showPercent = false,
  color = "violet",
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercent && <span className="text-sm font-semibold text-gray-900">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[size]}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${colorClasses[color]} ${heightClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
