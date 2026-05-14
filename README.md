# Dusk — Travel Planning App

> *"para quem encontra sentido no caminho"*

Dusk is a collaborative travel planning app designed to keep everything about your trip in one place — flights, stays, expenses, packing lists, and itineraries — shared with everyone traveling with you.

---

## Features

- **Magic link auth** — no passwords, sign in via email link
- **Trip management** — create trips with custom covers, invite members by email
- **Flights** — log flights with IATA codes, departure/arrival times and booking codes
- **Accommodation** — track stays with check-in/out, attach receipts (image or PDF)
- **Expenses** — log costs in multiple currencies (BRL, USD, EUR, ARS), split between members, visualize by category and day
- **Packing list** — organized by section (documents, carry-on, checked bag, etc.) with progress tracking
- **Itinerary planner** — drag-and-drop activity scheduling with conflict detection
- **Trip notes** — shared notes synced across all members in real time
- **File uploads** — custom trip covers and stay receipts stored in Supabase Storage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Fonts | Fraunces (display) · Poppins · Inter |
| Backend | Supabase (Postgres + Auth + Storage) |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Package manager | npm |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/erycaaf/dusk-travel-planning.git
cd dusk-travel-planning
npm install --legacy-peer-deps
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## Database Setup

Run the following SQL in your Supabase SQL Editor (in order):

<details>
<summary>1. Profiles</summary>

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  bio text,
  interests text[],
  pace text,
  gender text check (gender in ('feminino','masculino','nao-binario','prefiro-nao-dizer'))
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

</details>

<details>
<summary>2. Trips & Members</summary>

```sql
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text not null,
  origin_city text,
  start_date date not null,
  end_date date not null,
  cover_url text,
  status text not null default 'planning',
  styles text[],
  budget numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'editor',
  primary key (trip_id, user_id)
);
```

</details>

<details>
<summary>3. Flights</summary>

```sql
create table public.flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  airline text not null,
  flight_number text not null,
  from_code text not null,
  to_code text not null,
  from_city text not null,
  to_city text not null,
  departure timestamptz not null,
  arrival timestamptz not null,
  booking_code text not null default '',
  terminal text,
  gate text,
  created_at timestamptz default now()
);
```

</details>

<details>
<summary>4. Stays</summary>

```sql
create table public.stays (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  type text not null default 'hotel',
  address text,
  check_in timestamptz not null,
  check_out timestamptz not null,
  booking_code text not null default '',
  notes text,
  receipt_url text,
  created_at timestamptz default now()
);
```

</details>

<details>
<summary>5. Expenses</summary>

```sql
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  currency text not null default 'BRL',
  category text not null default 'outro',
  paid_by uuid references public.profiles(id) on delete set null,
  date date not null default current_date,
  split_with uuid[] not null default '{}',
  created_at timestamptz default now()
);
```

</details>

<details>
<summary>6. Packing</summary>

```sql
create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  section text not null default 'pessoais',
  packed boolean not null default false,
  qty integer not null default 1,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
```

</details>

<details>
<summary>7. Itinerary</summary>

```sql
create table public.activity_ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  category text not null default 'cultura',
  duration_min integer not null default 60,
  transit_min integer,
  estimated_cost numeric(10,2),
  location text,
  notes text,
  priority text default 'med',
  map_url text,
  created_at timestamptz default now()
);

create table public.scheduled_activities (
  id uuid primary key references public.activity_ideas(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  start_min integer not null
);
```

</details>

<details>
<summary>8. Storage buckets</summary>

```sql
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('covers', 'covers', true);

create policy "covers allow insert" on storage.objects for insert with check (bucket_id = 'covers');
create policy "covers allow select" on storage.objects for select using (bucket_id = 'covers');
create policy "covers allow delete" on storage.objects for delete using (bucket_id = 'covers');
```

</details>

---

## Project Structure

```
src/
├── components/        # Shared UI components
├── layouts/           # AppShell, AuthLayout
├── lib/
│   ├── supabase.ts    # Supabase client
│   ├── types.ts       # TypeScript interfaces
│   └── utils.ts       # Helpers
├── pages/
│   ├── auth/          # Intro, Login, Signup
│   ├── trip/          # Per-trip pages (flights, stays, expenses…)
│   ├── NewTrip.tsx
│   ├── Profile.tsx
│   └── Trips.tsx
└── services/
    └── index.ts       # All Supabase data access
```

---

## Development Workflow

```
main    ← stable, Lovable syncs from here
  └── develop ← active development branch
```

1. Work on `develop`
2. Merge `develop` → `main` to update the Lovable preview and deploy

---

## Roadmap

- [ ] Enable RLS policies before public release
- [ ] Ground transport persistence (currently localStorage)
- [ ] AI-powered activity recommendations (phase 2)
- [ ] Mobile PWA

---

## License

Personal project — not open for public use.
