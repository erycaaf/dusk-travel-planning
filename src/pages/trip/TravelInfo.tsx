import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { flightsService, tripsService } from "@/services";
import type { Flight, Trip } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plane, Plus, ArrowRight } from "lucide-react";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { cn } from "@/lib/utils";

type Tab = "voos" | "terrestre" | "paises" | "anotacoes";

export default function TravelInfo() {
  const { id } = useParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tab, setTab] = useState<Tab>("voos");
  const [notes, setNotes] = useState("Lembrar de levar adaptador tipo I (Argentina) · Confirmar reserva da bodega 48h antes.");

  useEffect(() => { if (id) { flightsService.byTrip(id).then(setFlights); tripsService.get(id).then((t) => setTrip(t || null)); } }, [id]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">Voos & informações</h1>
        <p className="text-muted-foreground text-sm">Tudo que importa para chegar lá.</p>
      </header>

      <div className="inline-flex rounded-full bg-muted p-1">
        {([["voos","Voos"],["terrestre","Transporte terrestre"],["paises","Países e cidades"],["anotacoes","Anotações"]] as [Tab,string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium", tab===k ? "bg-card shadow-soft" : "text-muted-foreground")}>{l}</button>
        ))}
      </div>

      {tab === "voos" && (
        <div className="space-y-4">
          {flights.map((f) => (
            <article key={f.id} className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/10 text-secondary p-2.5"><Plane className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display font-semibold">{f.airline} · {f.flightNumber}</p>
                    <p className="text-xs text-muted-foreground">Reserva {f.bookingCode}</p>
                  </div>
                </div>
                {f.terminal && <span className="text-xs text-muted-foreground">Terminal {f.terminal}{f.gate ? ` · Portão ${f.gate}` : ""}</span>}
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="text-center">
                  <p className="font-display font-bold text-2xl">{f.fromCode}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(f.departure)} · {fmtTime(f.departure)}</p>
                  <p className="text-xs text-muted-foreground">{f.fromCity}</p>
                </div>
                <div className="flex-1 flex items-center gap-2 text-muted-foreground">
                  <div className="h-px bg-border flex-1" /><Plane className="h-4 w-4 -rotate-12" /><div className="h-px bg-border flex-1" />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-2xl">{f.toCode}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(f.arrival)} · {fmtTime(f.arrival)}</p>
                  <p className="text-xs text-muted-foreground">{f.toCity}</p>
                </div>
              </div>
            </article>
          ))}
          <Button variant="outline"><Plus className="h-4 w-4" /> Adicionar voo</Button>
        </div>
      )}

      {tab === "terrestre" && (
        <div className="rounded-2xl bg-card border border-border/50 p-8 text-center text-muted-foreground">
          Nenhum transporte terrestre adicionado ainda.<br />
          <Button variant="outline" className="mt-4"><Plus className="h-4 w-4" /> Adicionar transporte</Button>
        </div>
      )}

      {tab === "paises" && trip && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary/10 text-secondary px-3 py-1.5 text-sm font-medium">🇦🇷 {trip.country}</span>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <p className="text-sm text-muted-foreground mb-2">Cidades em {trip.country}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-sm">{trip.city}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm">Maipú</span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm">Luján de Cuyo</span>
            </div>
          </div>
          <MapPlaceholder pins={[
            { id: "o", label: "Origem", x: 25, y: 65, tone: "secondary" },
            { id: "d", label: "Mendoza", x: 70, y: 40, tone: "primary" },
          ]} height={320} />
        </div>
      )}

      {tab === "anotacoes" && (
        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full min-h-[200px] bg-transparent border-0 outline-none resize-none text-sm" />
        </div>
      )}
    </div>
  );
}
