import { Link } from "react-router-dom";
import type { Trip, User } from "@/lib/types";
import { TravelerAvatarGroup } from "./TravelerAvatarGroup";
import { StatusPill, tripStatusLabel } from "./StatusPill";
import { fmtDateRange, daysUntil } from "@/lib/format";
import { MapPin } from "lucide-react";

interface Props {
  trip: Trip;
  members: User[];
}

export function TripCard({ trip, members }: Props) {
  const days = daysUntil(trip.startDate);
  const countdown = days > 0 ? `faltam ${days} dias` : days === 0 ? "começa hoje" : `${Math.abs(days)} dias atrás`;
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block rounded-2xl bg-card overflow-hidden shadow-card card-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Abrir viagem ${trip.name}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={trip.coverUrl}
          alt={`${trip.city}, ${trip.country}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusPill tone={trip.status}>{tripStatusLabel(trip.status)}</StatusPill>
        </div>
        <div className="absolute bottom-3 right-3">
          <TravelerAvatarGroup users={members} size={28} ringClass="ring-white/90" />
        </div>
      </div>
      <div className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-semibold text-lg leading-tight">{trip.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <span>{trip.city}, {trip.country}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-foreground/80">{fmtDateRange(trip.startDate, trip.endDate)}</span>
          <span className="text-xs font-medium text-primary">{countdown}</span>
        </div>
      </div>
    </Link>
  );
}
