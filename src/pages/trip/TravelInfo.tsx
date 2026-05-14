import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { flightsService, tripsService } from "@/services";
import type { Flight, Trip } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Plus, X, Trash2, Bus, Train, Car, Ship, Map as MapIcon, Check } from "lucide-react";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { cn, errorMessage } from "@/lib/utils";
import { toast } from "sonner";

type GroundType = "onibus" | "trem" | "carro" | "ferry" | "outro";
interface Ground {
  id: string;
  type: GroundType;
  fromCity: string;
  toCity: string;
  departure: string;
  arrival: string;
  bookingCode?: string;
}

const GROUND_META: Record<GroundType, { label: string; icon: typeof Bus }> = {
  onibus: { label: "Ônibus", icon: Bus },
  trem: { label: "Trem", icon: Train },
  carro: { label: "Carro", icon: Car },
  ferry: { label: "Ferry", icon: Ship },
  outro: { label: "Outro", icon: MapIcon },
};

const EMPTY_GROUND = {
  type: "onibus" as GroundType,
  fromCity: "",
  toCity: "",
  departure: "",
  arrival: "",
  bookingCode: "",
};


type Tab = "voos" | "terrestre" | "paises" | "anotacoes";

const EMPTY_FORM = {
  airline: "",
  flightNumber: "",
  fromCode: "",
  fromCity: "",
  toCode: "",
  toCity: "",
  departure: "",
  arrival: "",
  bookingCode: "",
  terminal: "",
  gate: "",
};

export default function TravelInfo() {
  const { id } = useParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tab, setTab] = useState<Tab>("voos");
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [notesSavedFlash, setNotesSavedFlash] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [showGroundForm, setShowGroundForm] = useState(false);
  const [groundForm, setGroundForm] = useState(EMPTY_GROUND);

  const notesKey = id ? `dusk:trip:${id}:notes` : "";
  const groundsKey = id ? `dusk:trip:${id}:grounds` : "";

  const load = () => {
    if (!id) return;
    flightsService.byTrip(id).then(setFlights).catch(() => {});
    tripsService.get(id).then((t) => setTrip(t || null));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      const n = localStorage.getItem(notesKey) ?? "";
      setNotes(n);
      setSavedNotes(n);
      const g = localStorage.getItem(groundsKey);
      if (g) setGrounds(JSON.parse(g));
    } catch { /* ignore */ }
  }, [id, notesKey, groundsKey]);

  const persistGrounds = (next: Ground[]) => {
    setGrounds(next);
    try { localStorage.setItem(groundsKey, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const saveNotes = () => {
    try {
      localStorage.setItem(notesKey, notes);
      setSavedNotes(notes);
      setNotesSavedFlash(true);
      setTimeout(() => setNotesSavedFlash(false), 2000);
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar anotações"));
    }
  };

  const groundField = (key: keyof typeof EMPTY_GROUND) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setGroundForm((f) => ({ ...f, [key]: e.target.value }));

  const canSaveGround = groundForm.fromCity && groundForm.toCity && groundForm.departure && groundForm.arrival;

  const saveGround = () => {
    if (!canSaveGround) return;
    const next: Ground = {
      id: `gr-${Date.now().toString(36)}`,
      type: groundForm.type,
      fromCity: groundForm.fromCity,
      toCity: groundForm.toCity,
      departure: groundForm.departure,
      arrival: groundForm.arrival,
      bookingCode: groundForm.bookingCode || undefined,
    };
    persistGrounds([...grounds, next]);
    setGroundForm(EMPTY_GROUND);
    setShowGroundForm(false);
    toast.success("Transporte adicionado!");
  };

  const removeGround = (gid: string) => {
    persistGrounds(grounds.filter((g) => g.id !== gid));
    toast.success("Transporte removido.");
  };

  const field = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSave = form.airline && form.flightNumber && form.fromCode && form.toCode &&
    form.fromCity && form.toCity && form.departure && form.arrival;

  const save = async () => {
    if (!id || !canSave) return;
    setSaving(true);
    try {
      await flightsService.add({
        tripId: id,
        airline: form.airline,
        flightNumber: form.flightNumber,
        fromCode: form.fromCode.toUpperCase(),
        toCode: form.toCode.toUpperCase(),
        fromCity: form.fromCity,
        toCity: form.toCity,
        departure: form.departure,
        arrival: form.arrival,
        bookingCode: form.bookingCode,
        terminal: form.terminal || undefined,
        gate: form.gate || undefined,
      });
      toast.success("Voo adicionado!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar voo"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (flightId: string) => {
    try {
      await flightsService.remove(flightId);
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
      toast.success("Voo removido.");
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao remover voo"));
    }
  };

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
          {flights.length === 0 && !showForm && (
            <div className="rounded-2xl bg-card border border-border/50 p-8 text-center text-muted-foreground">
              Nenhum voo cadastrado ainda.
            </div>
          )}

          {flights.map((f) => (
            <article key={f.id} className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/10 text-secondary p-2.5"><Plane className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display font-semibold">{f.airline} · {f.flightNumber}</p>
                    {f.bookingCode && <p className="text-xs text-muted-foreground">Reserva {f.bookingCode}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.terminal && <span className="text-xs text-muted-foreground">Terminal {f.terminal}{f.gate ? ` · Portão ${f.gate}` : ""}</span>}
                  <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" aria-label="Remover voo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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

          {showForm && (
            <div className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">Novo voo</p>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Companhia aérea</Label>
                  <Input value={form.airline} onChange={field("airline")} placeholder="LATAM" />
                </div>
                <div className="space-y-1">
                  <Label>Número do voo</Label>
                  <Input value={form.flightNumber} onChange={field("flightNumber")} placeholder="LA8093" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Origem (código IATA)</Label>
                  <Input value={form.fromCode} onChange={field("fromCode")} placeholder="GRU" maxLength={3} className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Cidade de origem</Label>
                  <Input value={form.fromCity} onChange={field("fromCity")} placeholder="São Paulo" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Destino (código IATA)</Label>
                  <Input value={form.toCode} onChange={field("toCode")} placeholder="MDZ" maxLength={3} className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Cidade de destino</Label>
                  <Input value={form.toCity} onChange={field("toCity")} placeholder="Mendoza" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Partida</Label>
                  <Input type="datetime-local" value={form.departure} onChange={field("departure")} />
                </div>
                <div className="space-y-1">
                  <Label>Chegada</Label>
                  <Input type="datetime-local" value={form.arrival} onChange={field("arrival")} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Código de reserva</Label>
                  <Input value={form.bookingCode} onChange={field("bookingCode")} placeholder="ABC123" />
                </div>
                <div className="space-y-1">
                  <Label>Terminal</Label>
                  <Input value={form.terminal} onChange={field("terminal")} placeholder="2" />
                </div>
                <div className="space-y-1">
                  <Label>Portão</Label>
                  <Input value={form.gate} onChange={field("gate")} placeholder="B12" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancelar</Button>
                <Button variant="sunset" onClick={save} disabled={!canSave || saving}>
                  {saving ? "Salvando..." : "Salvar voo"}
                </Button>
              </div>
            </div>
          )}

          {!showForm && (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Adicionar voo
            </Button>
          )}
        </div>
      )}

      {tab === "terrestre" && (
        <div className="space-y-4">
          {grounds.length === 0 && !showGroundForm && (
            <div className="rounded-2xl bg-card border border-border/50 p-8 text-center text-muted-foreground">
              Nenhum transporte terrestre adicionado ainda.
            </div>
          )}

          {grounds.map((g) => {
            const meta = GROUND_META[g.type];
            const Icon = meta.icon;
            return (
              <article key={g.id} className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 text-primary p-2.5"><Icon className="h-5 w-5" /></div>
                    <div>
                      <p className="font-display font-semibold">{meta.label}</p>
                      {g.bookingCode && <p className="text-xs text-muted-foreground">Reserva {g.bookingCode}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeGround(g.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" aria-label="Remover transporte">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="text-center flex-1">
                    <p className="font-display font-bold text-lg">{g.fromCity}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(g.departure)} · {fmtTime(g.departure)}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-muted-foreground">
                    <div className="h-px bg-border flex-1" /><Icon className="h-4 w-4" /><div className="h-px bg-border flex-1" />
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-display font-bold text-lg">{g.toCity}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(g.arrival)} · {fmtTime(g.arrival)}</p>
                  </div>
                </div>
              </article>
            );
          })}

          {showGroundForm && (
            <div className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">Novo transporte</p>
                <button onClick={() => { setShowGroundForm(false); setGroundForm(EMPTY_GROUND); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-1">
                <Label>Tipo</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(GROUND_META) as GroundType[]).map((t) => {
                    const M = GROUND_META[t];
                    const Icon = M.icon;
                    const active = groundForm.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGroundForm((f) => ({ ...f, type: t }))}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
                          active ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-primary/40",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Origem</Label>
                  <Input value={groundForm.fromCity} onChange={groundField("fromCity")} placeholder="Mendoza" />
                </div>
                <div className="space-y-1">
                  <Label>Destino</Label>
                  <Input value={groundForm.toCity} onChange={groundField("toCity")} placeholder="Buenos Aires" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Partida</Label>
                  <Input type="datetime-local" value={groundForm.departure} onChange={groundField("departure")} />
                </div>
                <div className="space-y-1">
                  <Label>Chegada</Label>
                  <Input type="datetime-local" value={groundForm.arrival} onChange={groundField("arrival")} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Código de reserva</Label>
                <Input value={groundForm.bookingCode} onChange={groundField("bookingCode")} placeholder="opcional" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setShowGroundForm(false); setGroundForm(EMPTY_GROUND); }}>Cancelar</Button>
                <Button variant="sunset" onClick={saveGround} disabled={!canSaveGround}>Salvar transporte</Button>
              </div>
            </div>
          )}

          {!showGroundForm && (
            <Button variant="outline" onClick={() => setShowGroundForm(true)}>
              <Plus className="h-4 w-4" /> Adicionar transporte
            </Button>
          )}
        </div>
      )}

      {tab === "paises" && trip && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary/10 text-secondary px-3 py-1.5 text-sm font-medium">🌍 {trip.country}</span>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <p className="text-sm text-muted-foreground mb-2">Cidades em {trip.country}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-sm">{trip.city}</span>
            </div>
          </div>
          <MapPlaceholder pins={[
            { id: "o", label: "Origem", x: 25, y: 65, tone: "secondary" },
            { id: "d", label: trip.city, x: 70, y: 40, tone: "primary" },
          ]} height={320} />
        </div>
      )}

      {tab === "anotacoes" && (
        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações gerais sobre a viagem — adaptadores, contatos, confirmações..."
            className="w-full min-h-[200px] bg-transparent border-0 outline-none resize-none text-sm"
          />
        </div>
      )}
    </div>
  );
}
