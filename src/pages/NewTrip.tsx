import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coverGallery } from "@/lib/mock-data";
import { cn, errorMessage } from "@/lib/utils";
import { tripsService, storageService } from "@/services";
import { toast } from "sonner";
import { Check, X, ChevronLeft, ChevronRight, Sparkles, Calendar as CalIcon, Users as UsersIcon, MapPin, ImagePlus } from "lucide-react";
import type { TripStyle, UserRole } from "@/lib/types";
import { tripDuration, fmtDateRange } from "@/lib/format";

const STYLES: { id: TripStyle; label: string }[] = [
  { id: "relaxada", label: "Relaxada" },
  { id: "intensa", label: "Intensa" },
  { id: "gastronomica", label: "Gastronômica" },
  { id: "cultural", label: "Cultural" },
  { id: "natureza", label: "Natureza" },
  { id: "compras", label: "Compras" },
];

const STEPS = [
  { id: 1, label: "Destino", icon: MapPin },
  { id: 2, label: "Datas", icon: CalIcon },
  { id: 3, label: "Viajantes", icon: UsersIcon },
  { id: 4, label: "Estilo", icon: Sparkles },
];

export default function NewTrip() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [coverId, setCoverId] = useState<string>(coverGallery[0].id);
  const [customCover, setCustomCover] = useState<{ url: string; label: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [origin, setOrigin] = useState("São Paulo");

  const [memberInput, setMemberInput] = useState("");
  const [memberRole, setMemberRole] = useState<UserRole>("editor");
  const [members, setMembers] = useState<{ email: string; role: UserRole }[]>([]);

  const [styles, setStyles] = useState<TripStyle[]>([]);

  const cover = customCover && coverId === "custom"
    ? customCover
    : coverGallery.find((c) => c.id === coverId) ?? coverGallery[0];
  const duration = start && end ? tripDuration(start, end) : 0;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem grande demais — limite de 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setCustomCover({ url, label: file.name, file });
      setCoverId("custom");
    };
    reader.readAsDataURL(file);
  };

  const canNext = (() => {
    if (step === 1) return name.trim() && country.trim() && city.trim();
    if (step === 2) return start && end && new Date(end) >= new Date(start);
    if (step === 3) return true;
    if (step === 4) return styles.length > 0;
    return false;
  })();

  const addMember = () => {
    if (!memberInput.includes("@")) return;
    setMembers((m) => [...m, { email: memberInput.trim(), role: memberRole }]);
    setMemberInput("");
  };

  const [creating, setCreating] = useState(false);

  const submit = async () => {
    setCreating(true);
    try {
      let coverUrl: string;
      if (coverId === "custom" && customCover?.file) {
        coverUrl = await storageService.uploadCover(customCover.file);
      } else {
        coverUrl = `gallery:${coverId}`;
      }

      const trip = await tripsService.create({
        name,
        country,
        city,
        originCity: origin,
        startDate: start,
        endDate: end,
        coverUrl,
        status: "planning",
        styles,
      });

      // Try to add each invited member. Collect failures so we can warn the user
      // without blocking the trip creation itself.
      const failures: string[] = [];
      for (const m of members) {
        try {
          await tripsService.addMemberByEmail(trip.id, m.email, m.role);
        } catch (err) {
          failures.push(m.email);
          console.warn(`Falha ao convidar ${m.email}:`, err);
        }
      }

      if (failures.length > 0) {
        toast.warning(
          `Viagem criada, mas não consegui adicionar: ${failures.join(", ")}. Peça pra essas pessoas entrarem no Dusk e adicione depois.`,
        );
      } else {
        toast.success("Viagem criada — boa jornada!");
      }
      nav(`/trips/${trip.id}`);
    } catch (err) {
      console.error("Erro ao criar viagem:", err);
      const msg = errorMessage(err, "Erro ao criar viagem");
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <header>
        <h1 className="font-display font-semibold text-3xl">Nova viagem</h1>
        <p className="text-muted-foreground">Preencha os detalhes — você pode editar tudo depois.</p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center gap-2 sm:gap-4 flex-1">
              <div className={cn(
                "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors",
                active ? "bg-primary/10 text-primary" : done ? "text-success" : "text-muted-foreground",
              )}>
                <span className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-success text-success-foreground" : "bg-muted",
                )}>
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </li>
          );
        })}
      </ol>

      {/* Step content */}
      <div className="rounded-2xl bg-card p-6 sm:p-8 shadow-card border border-border/50 animate-fade-in">
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da viagem</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mendoza 2026" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Argentina" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mendoza" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Imagem de capa</Label>
                <p className="text-xs text-muted-foreground">Escolha da galeria ou envie a sua</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePick}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative rounded-xl overflow-hidden aspect-[4/3] ring-2 transition-all flex flex-col items-center justify-center gap-2",
                    coverId === "custom" && customCover
                      ? "ring-primary shadow-glow"
                      : "ring-dashed ring-border hover:ring-primary/60 bg-muted/40",
                  )}
                  aria-pressed={coverId === "custom"}
                  aria-label={customCover ? "Trocar imagem enviada" : "Enviar imagem própria"}
                >
                  {customCover ? (
                    <>
                      <img src={customCover.url} alt="Capa enviada" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Trocar imagem</span>
                      </div>
                      {coverId === "custom" && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">Enviar imagem própria</span>
                    </>
                  )}
                </button>
                {coverGallery.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoverId(c.id)}
                    className={cn(
                      "relative rounded-xl overflow-hidden aspect-[4/3] ring-2 transition-all",
                      coverId === c.id ? "ring-primary shadow-glow" : "ring-transparent hover:ring-primary/40",
                    )}
                    aria-pressed={coverId === c.id}
                  >
                    <img src={c.url} alt={c.label} className="h-full w-full object-cover" loading="lazy" />
                    {coverId === c.id && <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"><Check className="h-3 w-3" /></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de ida</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data de volta</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cidade de origem</Label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            {duration > 0 && (
              <div className="rounded-xl bg-sunset-soft p-4 text-sm">
                <span className="text-muted-foreground">Duração: </span>
                <span className="font-display font-semibold">{duration} {duration === 1 ? "dia" : "dias"}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Adicione viajantes por email. Você é a pessoa dona da viagem.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={memberInput} onChange={(e) => setMemberInput(e.target.value)} placeholder="email@exemplo.com" type="email" />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as UserRole)} className="h-11 rounded-full border border-input bg-card px-4 text-sm">
                <option value="editor">Editor</option>
                <option value="viewer">Visualizador</option>
              </select>
              <Button type="button" variant="outline" onClick={addMember}>Adicionar</Button>
            </div>
            {members.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {members.map((m, i) => (
                  <li key={i} className="inline-flex items-center gap-2 rounded-full bg-muted pl-3 pr-1 py-1 text-sm">
                    <span>{m.email}</span>
                    <span className="text-xs text-muted-foreground">· {m.role}</span>
                    <button onClick={() => setMembers((arr) => arr.filter((_, idx) => idx !== i))} className="rounded-full p-1 hover:bg-background" aria-label="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Selecione um ou mais estilos — usaremos para sugerir lugares e organizar o roteiro.</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const on = styles.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyles((arr) => on ? arr.filter((x) => x !== s.id) : [...arr, s.id])}
                    className={cn(
                      "tap rounded-full px-4 py-2 border text-sm font-medium transition-all",
                      on ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-card border-border hover:border-primary/40",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border/50 bg-sunset-soft p-5 space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Resumo</p>
              <div className="flex gap-4">
                <img src={cover.url} alt={cover.label} className="w-24 h-20 object-cover rounded-xl" />
                <div className="space-y-1">
                  <p className="font-display font-semibold text-lg">{name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{city}{country ? `, ${country}` : ""}</p>
                  {start && end && <p className="text-sm">{fmtDateRange(start, end)} · {duration} dias</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => step === 1 ? nav("/trips") : setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        {step < 4 ? (
          <Button variant="sunset" onClick={() => setStep(step + 1)} disabled={!canNext}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="sunset" onClick={submit} disabled={!canNext || creating}>
            {creating ? "Criando..." : "Criar viagem"}
          </Button>
        )}
      </div>
    </div>
  );
}
