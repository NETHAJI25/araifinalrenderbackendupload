import iaLogo from "../../assets/logos/ia logo.png";

/**
 * IALogoMark — icon-only version for header, sidebar, auth pages.
 * Crops horizontally to show the left (icon) portion of the logo.
 */
export function IALogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg flex-shrink-0 flex items-center justify-center bg-white"
      style={{ width: size, height: size }}
      aria-label="Innovators Arena logo"
    >
      <img
        src={iaLogo}
        alt="IA"
        className="h-full w-auto object-contain object-left"
        style={{ maxWidth: size * 2 }}
      />
    </div>
  );
}

/**
 * IAFullLogo — full logo including text, for hero and prominent displays.
 */
export function IAFullLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={iaLogo}
      alt="Innovators Arena 2.0"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
