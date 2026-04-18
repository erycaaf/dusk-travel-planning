import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtDate = (iso: string, pattern = "dd MMM yyyy") =>
  format(typeof iso === "string" ? parseISO(iso) : iso, pattern, { locale: ptBR });

export const fmtDateRange = (startISO: string, endISO: string) => {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${format(s, "dd MMM", { locale: ptBR })} – ${format(e, "dd MMM yyyy", { locale: ptBR })}${sameYear ? "" : ""}`;
};

export const fmtTime = (iso: string) => format(parseISO(iso), "HH:mm");

export const fmtRelative = (iso: string) =>
  formatDistanceToNow(parseISO(iso), { locale: ptBR, addSuffix: true });

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtCurrency = (n: number, currency: string) => {
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency });
  } catch {
    return `${currency} ${n.toLocaleString("pt-BR")}`;
  }
};

export const daysUntil = (iso: string) => {
  const d = differenceInDays(parseISO(iso), new Date());
  return d;
};

export const tripDuration = (startISO: string, endISO: string) =>
  differenceInDays(parseISO(endISO), parseISO(startISO)) + 1;

export const minutesToLabel = (min: number) => {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

export const minutesToHHmm = (min: number) => {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
