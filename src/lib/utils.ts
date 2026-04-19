import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a human-readable message from any thrown value.
 * Handles: Error instances, Supabase/PostgREST errors ({ message, code, details, hint }),
 * plain strings, and falls back to `fallback`.
 */
export function errorMessage(err: unknown, fallback = "Erro inesperado"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts: string[] = [];
    if (typeof o.message === "string" && o.message) parts.push(o.message);
    if (typeof o.details === "string" && o.details) parts.push(o.details);
    if (typeof o.hint === "string" && o.hint) parts.push(`(${o.hint})`);
    if (parts.length > 0) return parts.join(" · ");
  }
  return fallback;
}
