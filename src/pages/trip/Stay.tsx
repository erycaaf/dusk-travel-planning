import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { staysService } from "@/services";
import type { Stay } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { Button } from "@/components/ui/button";
import { Hotel, MapPin, Phone, Plus, Utensils, ShoppingBasket, Pill, Bus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const NEARBY = [
  { cat: "Restaurantes", icon: Utensils, items: [
    { name: "Restaurant Azafrán", dist: "350m" },
    { name: "Anna Bistró", dist: "1.2km" },
    { name: "Siete Cocinas", dist: "1.8km" },
  ]},
  { cat: "Mercados", icon: ShoppingBasket, items: [
    { name: "Carrefour Express", dist: "180m" },
    { name: "Vea Supermercado", dist: "650m" },
  ]},
  { cat: "Farmácias", icon: Pill, items: [
    { name: "Farmacity Sarmiento", dist: "210m" },
    { name: "Dr. Ahorro", dist: "550m" },
  ]},
  { cat: "Transporte", icon: Bus, items: [
    { name: "Parada Linha 100", dist: "90m" },
    { name: "Estação Mendoza", dist: "1.5km" },
  ]},
  { cat: "Atrações", icon: Camera, items: [
    { name: "Parque San Martín", dist: "1.1km" },
    { name: "Plaza Independencia", dist: "850m" },
  ]},
];

export default function StayPage() {
  const { id } = useParams();
  const [stays, setStays] = useState<Stay[]>([]);
  const [filter, setFilter] = useState(NEARBY[0].cat);

  useEffect(() => { if (id) staysService.byTrip(id).then(setStays); }, [id]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl">Hospedagem</h1>
          <p className="text-muted-foreground text-sm">Onde você vai descansar entre uma aventura e outra.</p>
        </div>
        <Button variant="sunset"><Plus className="h-4 w-4" /> Adicionar</Button>
      </header>

      {stays.map((s) => (
        <article key={s.id} className="rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-medium uppercase">{s.type}</span>
              </div>
              <h2 className="font-display font-semibold text-xl">{s.name}</h2>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {s.address}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{fmtDate(s.checkIn)} · {fmtTime(s.checkIn)}</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{fmtDate(s.checkOut)} · {fmtTime(s.checkOut)}</p></div>
              </div>
              {s.bookingCode && <p className="text-sm"><span className="text-muted-foreground">Reserva: </span><span className="font-mono">{s.bookingCode}</span></p>}
              {s.contact && <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> {s.contact}</p>}
              <Button variant="outline" size="sm">Anexar comprovante</Button>
            </div>
            <div className="p-6">
              <MapPlaceholder pins={[{ id: "stay", label: "Casa de Adobe", x: 50, y: 50, tone: "primary" }]} height={260} />
            </div>
          </div>

          <div className="border-t border-border/60 p-6 space-y-4">
            <h3 className="font-display font-semibold">Ao redor</h3>
            <div className="flex flex-wrap gap-2">
              {NEARBY.map((n) => (
                <button key={n.cat} onClick={() => setFilter(n.cat)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border", filter === n.cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                  <n.icon className="h-3.5 w-3.5" /> {n.cat}
                </button>
              ))}
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {NEARBY.find((n) => n.cat === filter)?.items.map((it) => (
                <li key={it.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                  <span className="font-medium">{it.name}</span>
                  <span className="text-xs text-muted-foreground">{it.dist}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
