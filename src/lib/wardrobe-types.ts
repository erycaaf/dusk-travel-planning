import { Shirt, Footprints, Briefcase, Sparkles, Layers, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WardrobeCategory =
  | "top" | "bottom" | "dress" | "layer" | "shoes" | "bag" | "accessory";

export const CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Peça inteira",
  layer: "Sobreposição",
  shoes: "Calçados",
  bag: "Bolsas",
  accessory: "Acessórios",
};

export const CATEGORY_ICONS: Record<WardrobeCategory, LucideIcon> = {
  top: Shirt,
  bottom: Layers,
  dress: Sun,
  layer: Layers,
  shoes: Footprints,
  bag: Briefcase,
  accessory: Sparkles,
};

export const ALL_CATEGORIES: WardrobeCategory[] = [
  "top", "bottom", "dress", "layer", "shoes", "bag", "accessory",
];

/** Order of zones in the look builder flat lay (top → bottom). */
export const LOOK_SLOT_ORDER: WardrobeCategory[] = [
  "accessory", "layer", "top", "bottom", "shoes", "bag",
];

export const OPTIONAL_SLOTS: WardrobeCategory[] = ["layer", "bag"];

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface LookSlot {
  category: WardrobeCategory;
  itemId?: string;
}

export interface Look {
  id: string;
  name: string;
  slots: LookSlot[];
  tripId?: string;
  itineraryDayId?: string;
  notes?: string;
  createdAt: string;
}

const ITEMS_KEY = "dusk:wardrobe_items";
const LOOKS_KEY = "dusk:wardrobe_looks";

export function loadItems(): WardrobeItem[] {
  try { return JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]"); } catch { return []; }
}
export function saveItems(items: WardrobeItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}
export function loadLooks(): Look[] {
  try { return JSON.parse(localStorage.getItem(LOOKS_KEY) || "[]"); } catch { return []; }
}
export function saveLooks(looks: Look[]) {
  localStorage.setItem(LOOKS_KEY, JSON.stringify(looks));
}

export function emptySlots(): LookSlot[] {
  return LOOK_SLOT_ORDER.map((category) => ({ category }));
}

export function addLookToPacking(tripId: string, look: Look, items: WardrobeItem[]) {
  const key = `dusk:packing_${tripId}`;
  let existing: { id: string; name: string; checked: boolean }[] = [];
  try { existing = JSON.parse(localStorage.getItem(key) || "[]"); } catch { /* noop */ }
  const names = look.slots
    .map((s) => s.itemId ? items.find((i) => i.id === s.itemId)?.name : null)
    .filter((n): n is string => Boolean(n));
  const toAdd = names
    .filter((n) => !existing.some((e) => e.name.toLowerCase() === n.toLowerCase()))
    .map((n) => ({ id: crypto.randomUUID(), name: n, checked: false }));
  localStorage.setItem(key, JSON.stringify([...existing, ...toAdd]));
  return toAdd.length;
}
