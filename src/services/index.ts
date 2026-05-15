// Service layer — abstracts data access so a real Supabase backend
// can replace the mock store later without touching components.
import { coverGallery, expenses as expSeed, flights as flSeed, ideas as ideaSeed, packing as pkSeed, scheduled as schSeed, stays as staySeed, trips as tripSeed, users } from "@/lib/mock-data";
import type { ActivityFeedItem, ActivityIdea, Expense, Flight, PackingItem, ScheduledActivity, Stay, Trip, TripMember, User, UserRole } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// In-memory store (lives for the session)
const store = {
  trips: [...tripSeed],
  flights: [...flSeed],
  stays: [...staySeed],
  ideas: [...ideaSeed],
  scheduled: [...schSeed],
  expenses: [...expSeed],
  packing: [...pkSeed],
  users: [...users],
};

const wait = <T>(value: T) => Promise.resolve(value);

// === Users (mock — still used by mock trip members until slice 3) ===
export const usersService = {
  list: () => wait(store.users),
  get: (uid: string) => wait(store.users.find((u) => u.id === uid)),
  update: (uid: string, patch: Partial<User>) => {
    store.users = store.users.map((u) => (u.id === uid ? { ...u, ...patch } : u));
    return wait(store.users.find((u) => u.id === uid)!);
  },
};

// === Profiles (Supabase — real persistent data) ===
const PROFILE_COLUMNS = "id, email, name, avatar_url, bio, interests, pace, gender";

const rowToUser = (row: {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  pace: string | null;
  gender: string | null;
}): User => ({
  id: row.id,
  email: row.email,
  name: row.name ?? "",
  avatarUrl: row.avatar_url ?? undefined,
  bio: row.bio ?? undefined,
  interests: row.interests ?? [],
  pace: (row.pace as User["pace"]) ?? "balanced",
  gender: (row.gender as User["gender"]) ?? undefined,
});

export const profilesService = {
  /** Get the currently authenticated user's profile. Throws if not logged in. */
  getCurrent: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data) : null;
  },

  /** Update the current user's profile with a partial patch. */
  update: async (patch: Partial<User>): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.interests !== undefined) dbPatch.interests = patch.interests;
    if (patch.pace !== undefined) dbPatch.pace = patch.pace;
    if (patch.gender !== undefined) dbPatch.gender = patch.gender;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbPatch)
      .eq("id", user.id)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw error;
    return rowToUser(data);
  },

  /** Get any profile by id (for viewing trip-mates, avatars, etc.). */
  getById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data) : null;
  },

  /**
   * Upload an avatar image to the `avatars` bucket and return its public URL.
   * Path structure: <user_id>/<timestamp>.<ext> — timestamp ensures unique filename
   * so the browser doesn't serve a cached old image.
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    if (!file.type.startsWith("image/")) {
      throw new Error("Selecione um arquivo de imagem.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Imagem grande demais — limite de 5MB.");
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${Date.now()}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },
};

// === Trips (Supabase) ===
const TRIP_SELECT = `
  id, name, country, city, origin_city, start_date, end_date,
  cover_url, status, styles, budget, notes,
  members:trip_members(
    user_id,
    role,
    profile:profiles(id, email, name, avatar_url, bio, interests, pace, gender)
  )
`;

type TripRow = {
  id: string;
  name: string;
  country: string;
  city: string;
  origin_city: string | null;
  start_date: string;
  end_date: string;
  cover_url: string | null;
  status: Trip["status"];
  styles: Trip["styles"] | null;
  budget: number | null;
  notes: string | null;
  members?: Array<{
    user_id: string;
    role: UserRole;
    profile: Parameters<typeof rowToUser>[0] | null;
  }>;
};

// "gallery:mendoza" → URL local do asset; URLs absolutas passam direto
function resolveGalleryCover(raw: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("gallery:")) {
    const galleryId = raw.slice("gallery:".length);
    return coverGallery.find((c) => c.id === galleryId)?.url ?? "";
  }
  return raw;
}

const rowToTrip = (row: TripRow): Trip => ({
  id: row.id,
  name: row.name,
  country: row.country,
  city: row.city,
  originCity: row.origin_city ?? undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  coverUrl: resolveGalleryCover(row.cover_url),
  status: row.status,
  styles: row.styles ?? [],
  budget: row.budget ?? undefined,
  notes: row.notes ?? undefined,
  members: (row.members ?? []).map<TripMember>((m) => ({
    userId: m.user_id,
    role: m.role,
    profile: m.profile ? rowToUser(m.profile) : undefined,
  })),
});

export const tripsService = {
  list: async (): Promise<Trip[]> => {
    const { data, error } = await supabase
      .from("trips")
      .select(TRIP_SELECT)
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToTrip(r as unknown as TripRow));
  },

  get: async (tid: string): Promise<Trip | null> => {
    const { data, error } = await supabase
      .from("trips")
      .select(TRIP_SELECT)
      .eq("id", tid)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTrip(data as unknown as TripRow) : null;
  },

  create: async (trip: Omit<Trip, "id" | "members">): Promise<Trip> => {
    // Diagnóstico: garante que temos sessão ativa antes de tentar o insert
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    console.log("[tripsService.create] sessão:", {
      hasSession: !!sessionData.session,
      userId: user?.id,
      email: user?.email,
      tokenPreview: sessionData.session?.access_token?.slice(0, 20),
    });
    if (!user) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const { data, error } = await supabase
      .from("trips")
      .insert({
        name: trip.name,
        country: trip.country,
        city: trip.city,
        origin_city: trip.originCity ?? null,
        start_date: trip.startDate,
        end_date: trip.endDate,
        cover_url: trip.coverUrl || null,
        status: trip.status,
        styles: trip.styles,
        budget: trip.budget ?? null,
      })
      .select(TRIP_SELECT)
      .single();
    if (error) throw error;
    const newTrip = rowToTrip(data as unknown as TripRow);
    recordFeedEvent(newTrip.id, `criou a viagem "${trip.name}"`).catch(() => {});
    return newTrip;
  },

  updateNotes: async (tripId: string, notes: string): Promise<void> => {
    const { error } = await supabase
      .from("trips")
      .update({ notes })
      .eq("id", tripId);
    if (error) throw error;
  },

  update: async (tripId: string, patch: Partial<Omit<Trip, "id" | "members">>): Promise<Trip> => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.country !== undefined) dbPatch.country = patch.country;
    if (patch.city !== undefined) dbPatch.city = patch.city;
    if (patch.originCity !== undefined) dbPatch.origin_city = patch.originCity;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
    if (patch.coverUrl !== undefined) dbPatch.cover_url = patch.coverUrl;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.styles !== undefined) dbPatch.styles = patch.styles;
    if (patch.budget !== undefined) dbPatch.budget = patch.budget ?? null;

    const { data, error } = await supabase
      .from("trips")
      .update(dbPatch)
      .eq("id", tripId)
      .select(TRIP_SELECT)
      .single();
    if (error) throw error;
    recordFeedEvent(tripId, "editou os detalhes da viagem").catch(() => {});
    return rowToTrip(data as unknown as TripRow);
  },

  remove: async (tripId: string): Promise<void> => {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) throw error;
  },

  /** Add a member by looking up their email in profiles. Throws if no match. */
  addMemberByEmail: async (tripId: string, email: string, role: UserRole = "editor") => {
    const normalized = email.trim().toLowerCase();
    const { data: profile, error: lookupErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!profile) {
      throw new Error(
        `Não achei uma conta com o email ${normalized}. Peça pra essa pessoa entrar no Dusk primeiro.`,
      );
    }

    const { error } = await supabase
      .from("trip_members")
      .insert({ trip_id: tripId, user_id: profile.id, role });
    if (error) {
      if (error.code === "23505") {
        throw new Error("Essa pessoa já é membro desta viagem.");
      }
      throw error;
    }
  },

  removeMember: async (tripId: string, userId: string) => {
    const { error } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// === Flights (Supabase) ===
type FlightRow = {
  id: string;
  trip_id: string;
  airline: string;
  flight_number: string;
  from_code: string;
  to_code: string;
  from_city: string;
  to_city: string;
  departure: string;
  arrival: string;
  booking_code: string;
  terminal: string | null;
  gate: string | null;
};

const rowToFlight = (r: FlightRow): Flight => ({
  id: r.id,
  tripId: r.trip_id,
  airline: r.airline,
  flightNumber: r.flight_number,
  fromCode: r.from_code,
  toCode: r.to_code,
  fromCity: r.from_city,
  toCity: r.to_city,
  departure: r.departure,
  arrival: r.arrival,
  bookingCode: r.booking_code,
  terminal: r.terminal ?? undefined,
  gate: r.gate ?? undefined,
});

export const flightsService = {
  byTrip: async (tid: string): Promise<Flight[]> => {
    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("trip_id", tid)
      .order("departure", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToFlight(r as FlightRow));
  },

  add: async (f: Omit<Flight, "id">): Promise<Flight> => {
    const { data, error } = await supabase
      .from("flights")
      .insert({
        trip_id: f.tripId,
        airline: f.airline,
        flight_number: f.flightNumber,
        from_code: f.fromCode,
        to_code: f.toCode,
        from_city: f.fromCity,
        to_city: f.toCity,
        departure: f.departure,
        arrival: f.arrival,
        booking_code: f.bookingCode,
        terminal: f.terminal ?? null,
        gate: f.gate ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    const flight = rowToFlight(data as FlightRow);
    recordFeedEvent(f.tripId, `adicionou o voo ${f.airline} ${f.flightNumber} (${f.fromCode} → ${f.toCode})`).catch(() => {});
    return flight;
  },

  remove: async (flightId: string): Promise<void> => {
    const { error } = await supabase.from("flights").delete().eq("id", flightId);
    if (error) throw error;
  },
};

// === Stays (Supabase) ===
type StayRow = {
  id: string;
  trip_id: string;
  name: string;
  type: string;
  address: string | null;
  check_in: string;
  check_out: string;
  booking_code: string;
  notes: string | null;
  receipt_url: string | null;
};

const rowToStay = (r: StayRow): Stay => ({
  id: r.id,
  tripId: r.trip_id,
  name: r.name,
  type: r.type as Stay["type"],
  address: r.address ?? "",
  checkIn: r.check_in,
  checkOut: r.check_out,
  bookingCode: r.booking_code || undefined,
  receiptUrl: r.receipt_url ?? undefined,
});

export const staysService = {
  byTrip: async (tid: string): Promise<Stay[]> => {
    const { data, error } = await supabase
      .from("stays")
      .select("*")
      .eq("trip_id", tid)
      .order("check_in", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToStay(r as StayRow));
  },

  add: async (s: Omit<Stay, "id">): Promise<Stay> => {
    const { data, error } = await supabase
      .from("stays")
      .insert({
        trip_id: s.tripId,
        name: s.name,
        type: s.type,
        address: s.address || null,
        check_in: s.checkIn,
        check_out: s.checkOut,
        booking_code: s.bookingCode ?? "",
      })
      .select("*")
      .single();
    if (error) throw error;
    const stay = rowToStay(data as StayRow);
    recordFeedEvent(s.tripId, `adicionou hospedagem: ${s.name}`).catch(() => {});
    return stay;
  },

  remove: async (stayId: string): Promise<void> => {
    const { error } = await supabase.from("stays").delete().eq("id", stayId);
    if (error) throw error;
  },

  updateReceipt: async (stayId: string, receiptUrl: string): Promise<void> => {
    const { error } = await supabase
      .from("stays")
      .update({ receipt_url: receiptUrl })
      .eq("id", stayId);
    if (error) throw error;
  },
};

// === Itinerary (Supabase) ===
type IdeaRow = {
  id: string;
  trip_id: string;
  title: string;
  category: string;
  duration_min: number;
  transit_min: number | null;
  estimated_cost: number | null;
  location: string | null;
  notes: string | null;
  priority: string | null;
  map_url: string | null;
};

type SchedRow = {
  id: string;
  trip_id: string;
  date: string;
  start_min: number;
};

const rowToIdea = (r: IdeaRow): ActivityIdea => ({
  id: r.id,
  tripId: r.trip_id,
  title: r.title,
  category: r.category as ActivityIdea["category"],
  durationMin: r.duration_min,
  transitMin: r.transit_min ?? undefined,
  estimatedCost: r.estimated_cost ?? undefined,
  location: r.location ?? undefined,
  notes: r.notes ?? undefined,
  priority: (r.priority as ActivityIdea["priority"]) ?? undefined,
  mapUrl: r.map_url ?? undefined,
});

const rowToScheduled = (s: SchedRow, idea: ActivityIdea): ScheduledActivity => ({
  ...idea,
  date: s.date,
  startMin: s.start_min,
});

export const itineraryService = {
  ideas: async (tid: string): Promise<ActivityIdea[]> => {
    const { data, error } = await supabase
      .from("activity_ideas")
      .select("*")
      .eq("trip_id", tid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToIdea(r as IdeaRow));
  },

  scheduled: async (tid: string): Promise<ScheduledActivity[]> => {
    const [{ data: schedData, error: e1 }, { data: ideasData, error: e2 }] = await Promise.all([
      supabase.from("scheduled_activities").select("*").eq("trip_id", tid),
      supabase.from("activity_ideas").select("*").eq("trip_id", tid),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    const ideaMap = Object.fromEntries((ideasData ?? []).map((r) => [r.id, rowToIdea(r as IdeaRow)]));
    return (schedData ?? [])
      .map((s) => {
        const idea = ideaMap[(s as SchedRow).id];
        return idea ? rowToScheduled(s as SchedRow, idea) : null;
      })
      .filter(Boolean) as ScheduledActivity[];
  },

  addIdea: async (idea: Omit<ActivityIdea, "id">): Promise<ActivityIdea> => {
    const { data, error } = await supabase
      .from("activity_ideas")
      .insert({
        trip_id: idea.tripId,
        title: idea.title,
        category: idea.category,
        duration_min: idea.durationMin,
        transit_min: idea.transitMin ?? null,
        estimated_cost: idea.estimatedCost ?? null,
        location: idea.location ?? null,
        notes: idea.notes ?? null,
        priority: idea.priority ?? null,
        map_url: idea.mapUrl ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    const result = rowToIdea(data as IdeaRow);
    recordFeedEvent(idea.tripId, `adicionou a ideia "${idea.title}" ao roteiro`).catch(() => {});
    return result;
  },

  updateIdea: async (ideaId: string, patch: Partial<Omit<ActivityIdea, "id" | "tripId">>): Promise<ActivityIdea> => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.durationMin !== undefined) dbPatch.duration_min = patch.durationMin;
    if (patch.transitMin !== undefined) dbPatch.transit_min = patch.transitMin ?? null;
    if (patch.estimatedCost !== undefined) dbPatch.estimated_cost = patch.estimatedCost ?? null;
    if (patch.location !== undefined) dbPatch.location = patch.location ?? null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes ?? null;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority ?? null;
    const { data, error } = await supabase
      .from("activity_ideas")
      .update(dbPatch)
      .eq("id", ideaId)
      .select("*")
      .single();
    if (error) throw error;
    return rowToIdea(data as IdeaRow);
  },

  removeIdea: async (ideaId: string): Promise<void> => {
    await supabase.from("scheduled_activities").delete().eq("id", ideaId);
    const { error } = await supabase.from("activity_ideas").delete().eq("id", ideaId);
    if (error) throw error;
  },

  scheduleIdea: async (idea: ActivityIdea, date: string, startMin: number): Promise<ScheduledActivity> => {
    const { error } = await supabase
      .from("scheduled_activities")
      .upsert({ id: idea.id, trip_id: idea.tripId, date, start_min: startMin });
    if (error) throw error;
    const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    recordFeedEvent(idea.tripId, `agendou "${idea.title}" para ${dateLabel}`).catch(() => {});
    return { ...idea, date, startMin };
  },

  unschedule: async (ideaId: string): Promise<void> => {
    const { error } = await supabase.from("scheduled_activities").delete().eq("id", ideaId);
    if (error) throw error;
  },

  moveScheduled: async (item: ScheduledActivity, date: string, startMin: number): Promise<ScheduledActivity> => {
    const { error } = await supabase
      .from("scheduled_activities")
      .update({ date, start_min: startMin })
      .eq("id", item.id);
    if (error) throw error;
    return { ...item, date, startMin };
  },
};

// === Expenses (Supabase) ===
type ExpenseRow = {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string | null;
  date: string;
  split_with: string[];
};

const FX_TO_BRL: Record<string, number> = { BRL: 1, ARS: 0.0061, USD: 5.1, EUR: 5.5 };

const rowToExpense = (r: ExpenseRow): Expense => ({
  id: r.id,
  tripId: r.trip_id,
  title: r.description,
  category: r.category as Expense["category"],
  amount: Number(r.amount),
  currency: r.currency as Expense["currency"],
  amountBRL: Number(r.amount) * (FX_TO_BRL[r.currency] ?? 1),
  date: r.date,
  paidBy: r.paid_by ?? "",
  splitWith: r.split_with ?? [],
});

export const expensesService = {
  byTrip: async (tid: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tid)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => rowToExpense(r as ExpenseRow));
  },

  add: async (e: Omit<Expense, "id">): Promise<Expense> => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: e.tripId,
        description: e.title,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        paid_by: e.paidBy || null,
        date: e.date,
        split_with: e.splitWith,
      })
      .select("*")
      .single();
    if (error) throw error;
    const expense = rowToExpense(data as ExpenseRow);
    recordFeedEvent(e.tripId, `adicionou uma despesa: ${e.title} (${e.currency} ${e.amount.toLocaleString("pt-BR")})`).catch(() => {});
    return expense;
  },

  remove: async (expenseId: string): Promise<void> => {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
  },
};

// === Packing (Supabase) ===
type PackingRow = {
  id: string;
  trip_id: string;
  name: string;
  section: string;
  packed: boolean;
  qty: number;
  assigned_to: string | null;
};

const rowToPacking = (r: PackingRow): PackingItem => ({
  id: r.id,
  tripId: r.trip_id,
  name: r.name,
  section: r.section as PackingItem["section"],
  packed: r.packed,
  qty: r.qty,
  assignedTo: r.assigned_to ?? undefined,
});

export const packingService = {
  byTrip: async (tid: string): Promise<PackingItem[]> => {
    const { data, error } = await supabase
      .from("packing_items")
      .select("*")
      .eq("trip_id", tid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => rowToPacking(r as PackingRow));
  },

  add: async (p: Omit<PackingItem, "id">): Promise<PackingItem> => {
    const { data, error } = await supabase
      .from("packing_items")
      .insert({
        trip_id: p.tripId,
        name: p.name,
        section: p.section,
        packed: p.packed,
        qty: p.qty,
        assigned_to: p.assignedTo ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    const item = rowToPacking(data as PackingRow);
    recordFeedEvent(p.tripId, `adicionou "${p.name}" à lista de malas`).catch(() => {});
    return item;
  },

  toggle: async (pid: string): Promise<void> => {
    const { data, error: fetchErr } = await supabase
      .from("packing_items")
      .select("packed")
      .eq("id", pid)
      .single();
    if (fetchErr) throw fetchErr;
    const { error } = await supabase
      .from("packing_items")
      .update({ packed: !(data as { packed: boolean }).packed })
      .eq("id", pid);
    if (error) throw error;
  },

  remove: async (pid: string): Promise<void> => {
    const { error } = await supabase.from("packing_items").delete().eq("id", pid);
    if (error) throw error;
  },
};

// === Feed ===
type FeedRow = {
  id: string;
  trip_id: string;
  user_id: string;
  text: string;
  at: string;
};

const rowToFeedItem = (r: FeedRow): ActivityFeedItem => ({
  id: r.id,
  tripId: r.trip_id,
  userId: r.user_id,
  text: r.text,
  at: r.at,
});

// Best-effort — never throws; called fire-and-forget after mutations
async function recordFeedEvent(tripId: string, text: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activity_feed").insert({ trip_id: tripId, user_id: user.id, text });
  } catch {
    // feed events are non-critical
  }
}

export const feedService = {
  byTrip: async (tid: string): Promise<ActivityFeedItem[]> => {
    const { data, error } = await supabase
      .from("activity_feed")
      .select("*")
      .eq("trip_id", tid)
      .order("at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((r) => rowToFeedItem(r as FeedRow));
  },

  add: async (item: Omit<ActivityFeedItem, "id">): Promise<ActivityFeedItem> => {
    const { data, error } = await supabase
      .from("activity_feed")
      .insert({ trip_id: item.tripId, user_id: item.userId, text: item.text })
      .select("*")
      .single();
    if (error) throw error;
    return rowToFeedItem(data as FeedRow);
  },
};

// === Storage ===
export const storageService = {
  uploadCover: async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Imagem grande demais — limite de 10MB.");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (error) throw error;

    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  },

  uploadAttachment: async (file: File): Promise<string> => {
    if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo grande demais — limite de 20MB.");

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (error) throw error;

    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  },
};

// === Auth (Supabase) ===
export const authService = {
  /** Returns the current authenticated Supabase user, or null. */
  getCurrent: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  /** Sends a magic link to the provided email. If the user doesn't exist, Supabase creates them on first click. */
  signInWithMagicLink: async (email: string) => {
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/trips`,
      },
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
  },
  /** Subscribe to auth state changes. Returns an object with `unsubscribe()`. */
  onAuthStateChange: (callback: (userId: string | null) => void) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user?.id ?? null);
    });
    return data.subscription;
  },
};
