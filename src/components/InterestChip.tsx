import { cn } from "@/lib/utils";

interface Props {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function InterestChip({ label, selected = false, onToggle, className }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "tap inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-glow"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5",
        className,
      )}
    >
      {label}
    </button>
  );
}
