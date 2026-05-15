// Domain types — designed to mirror a future Supabase schema.

export type UserRole = "owner" | "editor" | "viewer";

export type Gender = "feminino" | "masculino" | "outro" | "prefiro_nao_dizer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  pace?: "calm" | "balanced" | "intense";
  gender?: Gender;
}

export type TripStatus = "planning" | "ongoing" | "done";
export type TripStyle = "relaxada" | "intensa" | "gastronomica" | "cultural" | "natureza" | "compras";

export interface TripMember {
  userId: string;
  role: UserRole;
  /** Populated when the trip is loaded with a profiles join. */
  profile?: User;
}

export interface Trip {
  id: string;
  name: string;
  country: string;
  city: string;
  originCity?: string;
  startDate: string; // ISO
  endDate: string;
  coverUrl: string;
  status: TripStatus;
  styles: TripStyle[];
  members: TripMember[];
  budget?: number; // BRL
  notes?: string;
}

export interface Flight {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departure: string; // ISO
  arrival: string;   // ISO
  bookingCode: string;
  terminal?: string;
  gate?: string;
}

export type StayType = "airbnb" | "booking" | "hotel" | "hostel" | "other";

export interface Stay {
  id: string;
  tripId: string;
  type: StayType;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  bookingCode?: string;
  contact?: string;
  receiptUrl?: string;
}

export type ActivityCategory =
  | "vinho"
  | "gastronomia"
  | "cultura"
  | "natureza"
  | "compras"
  | "passeio"
  | "transporte"
  | "outro";

export interface ActivityIdea {
  id: string;
  tripId: string;
  title: string;
  category: ActivityCategory;
  durationMin: number;        // minutes
  transitMin?: number;        // round-trip transit
  estimatedCost?: number;     // BRL
  location?: string;
  notes?: string;
  priority?: "low" | "med" | "high";
  mapUrl?: string;
}

export interface ScheduledActivity extends ActivityIdea {
  date: string;     // YYYY-MM-DD
  startMin: number; // minutes from 00:00
}

export type ExpenseCategory =
  | "roupas"
  | "medicamentos"
  | "documentos"
  | "passagens"
  | "bagagem"
  | "estadias"
  | "passeios"
  | "telefonia"
  | "transporte"
  | "lembrancinhas"
  | "alimentacao";

export type Currency = "BRL" | "ARS" | "USD" | "EUR";

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  amountBRL: number;
  date: string;
  paidBy: string; // userId
  splitWith: string[]; // userIds
}

export type PackingSection =
  | "documentos"
  | "mao"
  | "despachada"
  | "pessoais"
  | "medicamentos"
  | "eletronicos"
  | "roupas"
  | "higiene"
  | "comprar";

export interface PackingItem {
  id: string;
  tripId: string;
  section: PackingSection;
  name: string;
  qty: number;
  assignedTo?: string;
  packed: boolean;
}

export type GroundType = "onibus" | "trem" | "carro" | "ferry" | "outro";

export interface Ground {
  id: string;
  tripId: string;
  type: GroundType;
  fromCity: string;
  toCity: string;
  departure: string; // ISO
  arrival: string;   // ISO
  bookingCode?: string;
}

export interface ActivityFeedItem {
  id: string;
  tripId: string;
  userId: string;
  text: string;
  at: string; // ISO
}
