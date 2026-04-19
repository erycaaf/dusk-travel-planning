import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "full" | "mark" | "mono";

interface DuskLogoProps {
  size?: Size;
  variant?: Variant;
  className?: string;
  /** When true, the wordmark and horizon line render in white (for gradient/dark backgrounds). */
  onDark?: boolean;
}

const sizeMap: Record<Size, { mark: number; text: string; gap: string }> = {
  sm: { mark: 22, text: "text-xl", gap: "gap-2" },
  md: { mark: 30, text: "text-3xl", gap: "gap-2.5" },
  lg: { mark: 48, text: "text-5xl", gap: "gap-3" },
  xl: { mark: 72, text: "text-7xl", gap: "gap-4" },
};

/**
 * Dusk brand mark + wordmark.
 * - Mark: a sun setting over a horizon, inside a softly rounded frame. Filled with the signature sunset gradient.
 * - Wordmark: "Dusk" rendered in Fraunces (font-brand), a warm contemporary serif.
 */
export function DuskLogo({
  size = "md",
  variant = "full",
  className,
  onDark = false,
}: DuskLogoProps) {
  const { mark, text, gap } = sizeMap[size];
  const gradientId = `dusk-grad-${size}-${variant}`;

  const Mark = (
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
        {/* Clip path so the sun rays don't leak past the horizon */}
        <clipPath id={`${gradientId}-clip`}>
          <rect x="0" y="0" width="64" height="40" />
        </clipPath>
      </defs>

      {variant === "mono" ? (
        <g clipPath={`url(#${gradientId}-clip)`}>
          <circle cx="32" cy="40" r="18" fill="currentColor" />
        </g>
      ) : (
        <g clipPath={`url(#${gradientId}-clip)`}>
          <circle cx="32" cy="40" r="18" fill={`url(#${gradientId})`} />
        </g>
      )}

      {/* Horizon line */}
      <line
        x1="6"
        y1="40"
        x2="58"
        y2="40"
        stroke={variant === "mono" ? "currentColor" : onDark ? "#FFFFFF" : "#2F243A"}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={variant === "mono" ? 1 : onDark ? 0.95 : 0.85}
      />
    </svg>
  );

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", className)} aria-label="Dusk">
        {Mark}
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
      className={cn(
        "inline-flex items-center font-brand font-semibold tracking-tight leading-none",
        gap,
        text,
        textColor,
        className,
      )}
      aria-label="Dusk"
    >
      {Mark}
      <span>Dusk</span>
    </span>
  );
}

export default DuskLogo;
