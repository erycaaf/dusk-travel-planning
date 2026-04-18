import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface Pin {
  id: string;
  label: string;
  /** 0..100, percentage placement */
  x: number;
  y: number;
  tone?: "primary" | "secondary" | "accent";
}

interface Props {
  pins?: Pin[];
  height?: number | string;
  caption?: string;
  className?: string;
}

const toneClass = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
};

export function MapPlaceholder({ pins = [], height = 320, caption = "Mapa interativo disponível em breve", className }: Props) {
  return (
    <div
      className={cn("relative rounded-2xl overflow-hidden border border-border bg-sunset-soft", className)}
      style={{ height }}
      role="img"
      aria-label="Mapa estilizado com pinos"
    >
      {/* Subtle topographic feel */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id="topo" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="22" fill="none" stroke="hsl(var(--secondary))" strokeWidth="0.4" opacity="0.4" />
            <circle cx="30" cy="30" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#topo)" />
        <path d="M0,180 Q120,140 220,170 T400,150" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M0,220 Q150,190 260,210 T400,200" stroke="hsl(var(--secondary))" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>

      {pins.map((p) => (
        <div
          key={p.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-lift text-xs font-medium", toneClass[p.tone ?? "primary"])}>
            <MapPin className="h-3 w-3" />
            {p.label}
          </div>
          <div className="w-2 h-2 rounded-full bg-foreground mx-auto mt-0.5" />
        </div>
      ))}

      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-border">
        {caption}
      </div>
    </div>
  );
}
