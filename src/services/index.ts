// Service layer — abstracts data access so a real Supabase backend
// can replace the mock store later without touching components.
import { feed as feedSeed, expenses as expSeed, flights as flSeed, ideas as ideaSeed, packing as pkSeed, scheduled as schSeed, stays as staySeed, trips as tripSeed, users } from "@/lib/mock-data";
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
  feed: [...feedSeed],
  users: [...users],
};

const wait = <T>(value: T) => Promise.resolve(value);
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

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
  cover_url, status, styles, budget,
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
  members?: Array<{
    user_id: string;
    role: UserRole;
    profile: Parameters<typeof rowToUser>[0] | null;
  }>;
};

const rowToTrip = (row: TripRow): Trip => ({
  id: row.id,
  name: row.name,
  country: row.country,
  city: row.city,
  originCity: row.origin_city ?? undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  coverUrl: row.cover_url ?? "",
  status: row.status,
  styles: row.styles ?? [],
  budget: row.budget ?? undefined,
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
    return rowToTrip(data as unknown as TripRow);
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

// === Flights / Stays ===
export const flightsService = {
  byTrip: (tid: string) => wait(store.flights.filter((f) => f.tripId === tid)),
  add: (f: Omit<Flight, "id">) => {
    const fl: Flight = { ...f, id: id("f") };
    store.flights = [...store.flights, fl];
    return wait(fl);
  },
};

export const staysService = {
  byTrip: (tid: string) => wait(store.stays.filter((s) => s.tripId === tid)),
  add: (s: Omit<Stay, "id">) => {
    const st: Stay = { ...s, id: id("s") };
    store.stays = [...store.stays, st];
    return wait(st);
  },
};

// === Itinerary ===
export const itineraryService = {
  ideas: (tid: string) => wait(store.ideas.filter((a) => a.tripId === tid)),
  scheduled: (tid: string) => wait(store.scheduled.filter((a) => a.tripId === tid)),
  scheduleIdea: (ideaId: string, date: string, startMin: number) => {
    const idea = store.ideas.find((i) => i.id === ideaId);
    if (!idea) return wait(null);
    const sched: ScheduledActivity = { ...idea, date, startMin };
    store.scheduled = [...store.scheduled.filter((s) => s.id !== ideaId), sched];
    return wait(sched);
  },
  unschedule: (ideaId: string) => {
    store.scheduled = store.scheduled.filter((s) => s.id !== ideaId);
    return wait(true);
  },
  moveScheduled: (ideaId: string, date: string, startMin: number) => {
    store.scheduled = store.scheduled.map((s) => (s.id === ideaId ? { ...s, date, startMin } : s));
    return wait(store.scheduled.find((s) => s.id === ideaId));
  },
  addIdea: (idea: Omit<ActivityIdea, "id">) => {
    const a: ActivityIdea = { ...idea, id: id("a") };
    store.ideas = [...store.ideas, a];
    return wait(a);
  },
};

// === Expenses ===
export const expensesService = {
  byTrip: (tid: string) => wait(store.expenses.filter((e) => e.tripId === tid)),
  add: (e: Omit<Expense, "id">) => {
    const ex: Expense = { ...e, id: id("e") };
    store.expenses = [ex, ...store.expenses];
    return wait(ex);
  },
};

// === Packing ===
export const packingService = {
  byTrip: (tid: string) => wait(store.packing.filter((p) => p.tripId === tid)),
  toggle: (pid: string) => {
    store.packing = store.packing.map((p) => (p.id === pid ? { ...p, packed: !p.packed } : p));
    return wait(store.packing.find((p) => p.id === pid));
  },
  add: (p: Omit<PackingItem, "id">) => {
    const it: PackingItem = { ...p, id: id("p") };
    store.packing = [...store.packing, it];
    return wait(it);
  },
};

// === Feed ===
export const feedService = {
  byTrip: (tid: string) => wait(store.feed.filter((f) => f.tripId === tid).sort((a, b) => +new Date(b.at) - +new Date(a.at))),
  add: (item: Omit<ActivityFeedItem, "id">) => {
    const f: ActivityFeedItem = { ...item, id: id("fe") };
    store.feed = [f, ...store.feed];
    return wait(f);
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
