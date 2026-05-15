import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { expensesService, feedService, flightsService, itineraryService, packingService, staysService, tripsService } from "@/services";
import type { ActivityFeedItem, Expense, Flight, PackingItem, ScheduledActivity, Stay, Trip, User } from "@/lib/types";
import { GradientHero } from "@/components/GradientHero";
import { TravelerAvatarGroup } from "@/components/TravelerAvatarGroup";
import { StatCard } from "@/components/StatCard";
import { Plane, Hotel, Calendar, Wallet, Backpack, MapPin, Plus, ArrowRight } from "lucide-react";
import { fmtBRL, fmtDateRange, fmtRelative, fmtTime, daysUntil, tripDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function TripDashboard() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledActivity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packing, setPacking] = useState<PackingItem[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    if (!id) return;
    tripsService.get(id).then((t) => {
      if (!t) return;
      setTrip(t);
      setMembers(t.members.map((m) => m.profile).filter(Boolean) as User[]);
    });
    flightsService.byTrip(id).then(setFlights);
    staysService.byTrip(id).then(setStays);
    itineraryService.scheduled(id).then(setScheduled);
    expensesService.byTrip(id).then(setExpenses);
    packingService.byTrip(id).then(setPacking);
    feedService.byTrip(id).then(setFeed);
  }, [id]);

  if (!trip) {
    return <div className="container py-8"><div className="h-64 shimmer rounded-2xl" /></div>;
  }

  const days = daysUntil(trip.startDate);
  const duration = tripDuration(trip.startDate, trip.endDate);
  const totalSpent = expenses.reduce((s, e) => s + e.amountBRL, 0);
  const budget = trip.budget ?? 0;
  const budgetPct = budget ? Math.min(100, (totalSpent / budget) * 100) : 0;
  const packed = packing.filter((p) => p.packed).length;
  const packedPct = packing.length ? (packed / packing.length) * 100 : 0;
  const nextFlight = flights[0];
  const stay = stays[0];

  const userById = (uid: string) => members.find((m) => m.id === uid);

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Hero */}
      <GradientHero className="p-8 sm:p-10" imageSrc={trip.coverUrl}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wider text-white/80 font-medium">{fmtDateRange(trip.startDate, trip.endDate)} · {duration} dias</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight">{trip.name}</h1>
            <p className="flex items-center gap-2 text-white/90"><MapPin className="h-4 w-4" /> {trip.city}, {trip.country}</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm font-medium">
              {days > 0 ? `faltam ${days} dias` : days === 0 ? "começa hoje" : "em curso"}
            </div>
            <TravelerAvatarGroup users={members} size={36} ringClass="ring-white/80" />
          </div>
        </div>
      </GradientHero>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to={`/trips/${trip.id}/info`}><Plane className="h-4 w-4" /> Adicionar voo</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/trips/${trip.id}/stay`}><Hotel className="h-4 w-4" /> Adicionar hospedagem</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/trips/${trip.id}/itinerary`}><Calendar className="h-4 w-4" /> Planejar roteiro</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/trips/${trip.id}/expenses`}><Wallet className="h-4 w-4" /> Adicionar gasto</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/trips/${trip.id}/packing`}><Backpack className="h-4 w-4" /> Abrir checklist</Link></Button>
      </div>

      {/* Summary grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to={`/trips/${trip.id}/info`} className="card-lift">
          <StatCard
            label="Próximo voo"
            value={nextFlight ? `${nextFlight.airline} ${nextFlight.flightNumber}` : "—"}
            hint={nextFlight ? `${nextFlight.fromCode} → ${nextFlight.toCode} · ${fmtTime(nextFlight.departure)}` : "Adicionar voo"}
            icon={Plane}
            tone="secondary"
          />
        </Link>
        <Link to={`/trips/${trip.id}/stay`} className="card-lift">
          <StatCard
            label="Hospedagem"
            value={stay ? stay.name.split(" — ")[0] : "—"}
            hint={stay ? `Check-in ${fmtTime(stay.checkIn)}` : "Adicionar"}
            icon={Hotel}
            tone="primary"
          />
        </Link>
        <Link to={`/trips/${trip.id}/itinerary`} className="card-lift">
          <StatCard
            label="Roteiro"
            value={`${scheduled.length} atividades`}
            hint={`${duration} dias planejados`}
            icon={Calendar}
            tone="warning"
          />
        </Link>
        <Link to={`/trips/${trip.id}/expenses`} className="card-lift">
          <div className="rounded-2xl bg-card p-5 shadow-card border border-border/50 h-full">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Despesas</p>
                <p className="font-display font-semibold text-2xl">{fmtBRL(totalSpent)}</p>
                {budget > 0 && <p className="text-xs text-muted-foreground">de {fmtBRL(budget)}</p>}
              </div>
              <div className="rounded-xl bg-success/15 text-success p-2.5"><Wallet className="h-5 w-5" /></div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-sunset" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </Link>
        <Link to={`/trips/${trip.id}/packing`} className="card-lift">
          <div className="rounded-2xl bg-card p-5 shadow-card border border-border/50 h-full">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Mala</p>
                <p className="font-display font-semibold text-2xl">{Math.round(packedPct)}% embalado</p>
                <p className="text-xs text-muted-foreground">{packed} de {packing.length} itens</p>
              </div>
              <div className="rounded-xl bg-secondary/10 text-secondary p-2.5"><Backpack className="h-5 w-5" /></div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-sunset" style={{ width: `${packedPct}%` }} />
            </div>
          </div>
        </Link>
        <Link to={`/trips/${trip.id}/itinerary`} className="card-lift">
          <StatCard label="Lugares salvos" value={String(10)} hint="ideias e paradas" icon={MapPin} tone="primary" />
        </Link>
      </div>

      {/* Activity feed */}
      <section className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Últimas atualizações</h2>
        </div>
        {feed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atualização ainda. As ações da viagem aparecerão aqui.</p>
        ) : (
          <ul className="space-y-4">
            {feed.map((f) => {
              const u = userById(f.userId);
              return (
                <li key={f.id} className="flex gap-3 items-start">
                  {u?.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {(u?.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{u?.name?.split(" ")[0] ?? "Alguém"}</span>{" "}
                      <span className="text-muted-foreground">{f.text}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtRelative(f.at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
