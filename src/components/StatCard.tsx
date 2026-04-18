import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const toneMap = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/15 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default", className }: Props) {
  return (
    <div className={cn("rounded-2xl bg-card p-5 shadow-card border border-border/50", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
          <p className="font-display font-semibold text-2xl leading-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("rounded-xl p-2.5", toneMap[tone])}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
