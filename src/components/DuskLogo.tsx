import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "full" | "mark" | "mono";

interface DuskLogoProps {
  size?: Size;
  variant?: Variant;
  /** When variant is 'mono', renders the wordmark in this color via currentColor. */
  className?: string;
  /** When true, the wordmark text is rendered in white (for dark/gradient backgrounds). */
  onDark?: boolean;
}

const sizeMap: Record<Size, { mark: number; text: string }> = {
  sm: { mark: 20, text: "text-lg" },
  md: { mark: 28, text: "text-2xl" },
  lg: { mark: 44, text: "text-4xl" },
  xl: { mark: 64, text: "text-6xl" },
};

/**
 * The Dusk wordmark. The "u" is rendered as a half-circle sun setting on a horizon line,
 * filled with the signature sunset gradient.
 */
export function DuskLogo({
  size = "md",
  variant = "full",
  className,
  onDark = false,
}: DuskLogoProps) {
  const { mark, text } = sizeMap[size];
  const gradientId = `dusk-grad-${size}-${variant}`;

  const SunU = (
    <svg
      width={mark}
      height={mark}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6F3CC3" />
          <stop offset="60%" stopColor="#FF7A59" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
      </defs>
      {/* Half-circle sun */}
      {variant === "mono" ? (
        <>
          <path
            d="M8 38 a24 24 0 0 1 48 0"
            fill="currentColor"
          />
          <line x1="2" y1="42" x2="62" y2="42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path
            d="M8 38 a24 24 0 0 1 48 0"
            fill={`url(#${gradientId})`}
          />
          {/* horizon line */}
          <line
            x1="2"
            y1="42"
            x2="62"
            y2="42"
            stroke={onDark ? "#FFFFFF" : "#2F243A"}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={onDark ? 0.95 : 0.85}
          />
        </>
      )}
    </svg>
  );

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", className)} aria-label="Dusk">
        {SunU}
      </span>
    );
  }

  const textColor =
    variant === "mono"
      ? "text-current"
      : onDark
      ? "text-white"
      : "text-foreground";

  return (
    <span
      className={cn("inline-flex items-baseline gap-[0.15em] font-display font-semibold tracking-tight", text, textColor, className)}
      aria-label="Dusk"
    >
      <span>D</span>
      <span className="relative inline-flex items-end" style={{ height: "0.7em", width: "0.7em" }}>
        {SunU}
      </span>
      <span>sk</span>
    </span>
  );
}

export default DuskLogo;
