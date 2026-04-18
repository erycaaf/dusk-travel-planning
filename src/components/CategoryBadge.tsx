import { cn } from "@/lib/utils";
import type { ActivityCategory, ExpenseCategory } from "@/lib/types";
import { Wine, Utensils, Landmark, Trees, ShoppingBag, MapPin, Bus, Sparkles, Pill, FileText, Plane, Luggage, Hotel, Camera, Phone, Gift, Shirt, type LucideIcon } from "lucide-react";

const activityMeta: Record<ActivityCategory, { label: string; icon: LucideIcon; color: string }> = {
  vinho:        { label: "Vinho",        icon: Wine,       color: "266 53% 50%" },  // dusk purple
  gastronomia:  { label: "Gastronomia",  icon: Utensils,   color: "14 100% 67%" },  // coral
  cultura:      { label: "Cultura",      icon: Landmark,   color: "351 79% 65%" },
  natureza:     { label: "Natureza",     icon: Trees,      color: "142 50% 45%" },
  compras:      { label: "Compras",      icon: ShoppingBag,color: "25 98% 60%" },
  passeio:      { label: "Passeio",      icon: MapPin,     color: "200 60% 55%" },
  transporte:   { label: "Transporte",   icon: Bus,        color: "220 15% 45%" },
  outro:        { label: "Outro",        icon: Sparkles,   color: "273 7% 43%" },
};

const expenseMeta: Record<ExpenseCategory, { label: string; icon: LucideIcon; color: string }> = {
  roupas:        { label: "Roupas e viagem",   icon: Shirt,    color: "351 79% 65%" },
  medicamentos:  { label: "Medicamentos",      icon: Pill,     color: "0 70% 60%" },
  documentos:    { label: "Documentos",        icon: FileText, color: "220 15% 45%" },
  passagens:     { label: "Passagens",         icon: Plane,    color: "200 60% 55%" },
  bagagem:       { label: "Bagagem",           icon: Luggage,  color: "266 53% 50%" },
  estadias:      { label: "Estadias",          icon: Hotel,    color: "14 100% 60%" },
  passeios:      { label: "Passeios",          icon: Camera,   color: "25 98% 60%" },
  telefonia:     { label: "Telefonia",         icon: Phone,    color: "180 50% 45%" },
  transporte:    { label: "Transporte",        icon: Bus,      color: "220 30% 50%" },
  lembrancinhas: { label: "Lembrancinhas",     icon: Gift,     color: "330 70% 60%" },
  alimentacao:   { label: "Alimentação",       icon: Utensils, color: "14 100% 67%" },
};

export const getActivityMeta = (c: ActivityCategory) => activityMeta[c];
export const getExpenseMeta = (c: ExpenseCategory) => expenseMeta[c];

interface Props {
  category: ActivityCategory | ExpenseCategory;
  kind?: "activity" | "expense";
  className?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

export function CategoryBadge({ category, kind = "activity", className, size = "md", iconOnly = false }: Props) {
  const meta = kind === "activity"
    ? activityMeta[category as ActivityCategory] ?? activityMeta.outro
    : expenseMeta[category as ExpenseCategory];
  const Icon = meta.icon;
  const colorStyle = { backgroundColor: `hsl(${meta.color} / 0.14)`, color: `hsl(${meta.color})` };
  if (iconOnly) {
    return (
      <span className={cn("inline-flex items-center justify-center rounded-xl", size === "sm" ? "h-8 w-8" : "h-10 w-10", className)} style={colorStyle} title={meta.label}>
        <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-medium", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs", className)}
      style={colorStyle}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
}
