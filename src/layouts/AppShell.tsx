import { NavLink, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, Calendar, Wallet, Backpack, Users, User, Settings, Hotel, Plane, Shirt } from "lucide-react";
import { DuskLogo } from "@/components/DuskLogo";
import { cn } from "@/lib/utils";
import { TravelerAvatarGroup } from "@/components/TravelerAvatarGroup";
import { useEffect, useState } from "react";
import { tripsService, profilesService } from "@/services";
import type { Trip, User as TUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const tripNav = (tripId: string) => [
  { to: `/trips/${tripId}`,           label: "Visão geral", icon: Home,    end: true },
  { to: `/trips/${tripId}/info`,      label: "Voos & info", icon: Plane },
  { to: `/trips/${tripId}/stay`,      label: "Hospedagem",  icon: Hotel },
  { to: `/trips/${tripId}/itinerary`, label: "Roteiro",     icon: Calendar },
  { to: `/trips/${tripId}/expenses`,  label: "Gastos",      icon: Wallet },
  { to: `/trips/${tripId}/packing`,   label: "Mala",        icon: Backpack },
  { to: `/trips/${tripId}/members`,   label: "Viajantes",   icon: Users },
];

const baseNav = [
  { to: "/trips",    label: "Viagens",      icon: MapPin, end: true },
  { to: "/wardrobe", label: "Guarda-roupa", icon: Shirt },
  { to: "/profile",  label: "Perfil",       icon: User },
  { to: "/settings", label: "Ajustes",      icon: Settings },
];

export function AppShell() {
  const params = useParams();
  const tripId = params.id;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TUser[]>([]);
  const [me, setMe] = useState<TUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load current user's profile; if incomplete (no name), redirect to profile welcome.
  useEffect(() => {
    profilesService.getCurrent().then((profile) => {
      setMe(profile);
      if (profile && !profile.name.trim() && location.pathname !== "/profile") {
        navigate("/profile?welcome=1", { replace: true });
      }
    });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!tripId) { setTrip(null); setMembers([]); return; }
    tripsService.get(tripId).then((t) => {
      if (!t) return;
      setTrip(t);
      setMembers(t.members.map((m) => m.profile).filter(Boolean) as TUser[]);
    });
  }, [tripId]);

  const showTripNav = Boolean(tripId && trip);
  const navItems = showTripNav ? tripNav(tripId!) : baseNav;
  // For mobile bottom bar, always include base items + trip overview if in trip
  const mobileItems = showTripNav
    ? [
        { to: `/trips/${tripId}`,           label: "Viagem",  icon: Home, end: true },
        { to: `/trips/${tripId}/itinerary`, label: "Roteiro", icon: Calendar },
        { to: `/trips/${tripId}/expenses`,  label: "Gastos",  icon: Wallet },
        { to: `/trips/${tripId}/packing`,   label: "Mala",    icon: Backpack },
        { to: "/profile",                   label: "Perfil",  icon: User },
      ]
    : [
        { to: "/trips",    label: "Viagens",      icon: MapPin, end: true },
        { to: "/wardrobe", label: "Guarda-roupa", icon: Shirt },
        { to: "/profile",  label: "Perfil",       icon: User },
        { to: "/settings", label: "Ajustes",      icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <div className="px-6 py-6">
          <DuskLogo variant="full" size="md" />
        </div>
        {showTripNav && trip && (
          <div className="mx-3 mb-3 px-3 py-3 rounded-xl bg-sunset-soft">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Viagem atual</p>
            <p className="font-display font-semibold truncate">{trip.name}</p>
            <p className="text-xs text-muted-foreground">{trip.city}, {trip.country}</p>
          </div>
        )}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={(it as any).end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )
              }
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          ))}
          {showTripNav && (
            <NavLink to="/trips" className="flex items-center gap-3 px-3 py-2.5 mt-4 rounded-xl text-sm text-muted-foreground hover:text-foreground">
              <MapPin className="h-4 w-4" /> Todas as viagens
            </NavLink>
          )}
        </nav>
        <div className="px-3 pb-4">
          <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" /> Ajustes
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden">
                <DuskLogo variant="mark" size="md" />
              </div>
              {trip && (
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Viagem</p>
                  <p className="font-display font-semibold truncate">{trip.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {members.length > 0 && (
                <TravelerAvatarGroup users={members} size={28} ringClass="ring-background" />
              )}
              <Button size="icon" variant="ghost" aria-label="Notificações"><Bell className="h-4 w-4" /></Button>
              <NavLink to="/profile" className="rounded-full" aria-label="Seu perfil">
                <img
                  src={me?.avatarUrl ?? `https://i.pravatar.cc/200?u=${me?.email ?? "anon"}`}
                  alt={me?.name || "Seu perfil"}
                  className="h-9 w-9 rounded-full ring-2 ring-background object-cover"
                />
              </NavLink>
            </div>
          </div>
        </header>

        <main key={location.pathname} className="flex-1 pb-24 lg:pb-8 animate-fade-in">
          <Outlet />
        </main>

        {/* Bottom tabs (mobile) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
          <div className={cn("grid", showTripNav ? "grid-cols-5" : "grid-cols-4")}>
            {mobileItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={(it as any).end}
                className={({ isActive }) =>
                  cn(
                    "tap flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
