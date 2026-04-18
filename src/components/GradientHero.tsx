import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Extra layer over the gradient. */
  scrim?: boolean;
  /** Optional background image behind the gradient. */
  imageSrc?: string;
}

export function GradientHero({ children, className, scrim = true, imageSrc }: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-sunset text-white", className)}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
          loading="lazy"
        />
      )}
      {scrim && <div className="absolute inset-0 bg-foreground/25" aria-hidden />}
      <div className="relative">{children}</div>
    </div>
  );
}
