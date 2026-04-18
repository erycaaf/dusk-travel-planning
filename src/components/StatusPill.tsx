import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const pill = cva("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium font-body", {
  variants: {
    tone: {
      planning: "bg-secondary/10 text-secondary",
      ongoing: "bg-primary/15 text-primary",
      done: "bg-muted text-muted-foreground",
      success: "bg-success/15 text-success",
      warning: "bg-warning/15 text-warning",
      neutral: "bg-muted text-muted-foreground",
      sunset: "bg-sunset text-white",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface StatusPillProps extends VariantProps<typeof pill> {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusPill({ tone, children, className, icon }: StatusPillProps) {
  return (
    <span className={cn(pill({ tone }), className)}>
      {icon}
      {children}
    </span>
  );
}

export const tripStatusLabel = (s: "planning" | "ongoing" | "done") =>
  s === "planning" ? "Em planejamento" : s === "ongoing" ? "Em andamento" : "Concluída";
