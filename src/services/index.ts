// Service layer — abstracts data access so a real Supabase backend
// can replace the mock store later without touching components.
import { feed as feedSeed, expenses as expSeed, flights as flSeed, ideas as ideaSeed, packing as pkSeed, scheduled as schSeed, stays as staySeed, trips as tripSeed, users } from "@/lib/mock-data";
import type { ActivityFeedItem, ActivityIdea, Expense, Flight, PackingItem, ScheduledActivity, Stay, Trip, User } from "@/lib/types";

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

// === Users ===
export const usersService = {
  list: () => wait(store.users),
  get: (uid: string) => wait(store.users.find((u) => u.id === uid)),
  update: (uid: string, patch: Partial<User>) => {
    store.users = store.users.map((u) => (u.id === uid ? { ...u, ...patch } : u));
    return wait(store.users.find((u) => u.id === uid)!);
  },
};

// === Trips ===
export const tripsService = {
  list: () => wait(store.trips),
  get: (tid: string) => wait(store.trips.find((t) => t.id === tid)),
  create: (trip: Omit<Trip, "id">) => {
    const t: Trip = { ...trip, id: id("t") };
    store.trips = [t, ...store.trips];
    return wait(t);
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

// === Mock auth ===
export const authService = {
  getCurrent: () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("dusk:userId") : null;
    return wait(stored ? store.users.find((u) => u.id === stored) ?? null : null);
  },
  signIn: async (_email: string, _password: string) => {
    localStorage.setItem("dusk:userId", "u-eryca");
    return store.users[0];
  },
  signUp: async (name: string, email: string, _password: string) => {
    const u: User = { id: id("u"), name, email, avatarUrl: `https://i.pravatar.cc/200?u=${email}`, interests: [], pace: "balanced" };
    store.users = [...store.users, u];
    localStorage.setItem("dusk:userId", u.id);
    return u;
  },
  signOut: async () => {
    localStorage.removeItem("dusk:userId");
  },
};
