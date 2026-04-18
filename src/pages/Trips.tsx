import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tripsService, usersService } from "@/services";
import type { Trip, User } from "@/lib/types";
import { TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Mail, Plus } from "lucide-react";

export default function Trips() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([tripsService.list(), usersService.list()]).then(([t, u]) => {
      setTrips(t);
      setUsers(u);
    });
  }, []);

  const memberObjs = (t: Trip) => t.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as User[];

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl">Para qual viagem vamos hoje?</h1>
          <p className="text-muted-foreground mt-2">Suas viagens</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Mail className="h-4 w-4" /> Entrar com convite</Button>
          <Button asChild variant="sunset"><Link to="/trips/new"><Plus className="h-4 w-4" /> Nova viagem</Link></Button>
        </div>
      </header>

      {trips === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-card overflow-hidden shadow-card">
              <div className="aspect-[16/10] shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 shimmer rounded" />
                <div className="h-4 w-1/2 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="Você ainda não tem viagens."
          description="Que tal começar a planejar? Reúna voos, lugares, gastos e memórias em um só lugar."
          ctaLabel="Criar primeira viagem"
          onCta={() => window.location.assign("/trips/new")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => <TripCard key={t.id} trip={t} members={memberObjs(t)} />)}
        </div>
      )}
    </div>
  );
}
