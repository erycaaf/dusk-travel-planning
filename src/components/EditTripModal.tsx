import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coverGallery } from "@/lib/mock-data";
import { cn, errorMessage } from "@/lib/utils";
import { tripsService, storageService } from "@/services";
import { toast } from "sonner";
import { Check, ImagePlus } from "lucide-react";
import type { Trip, TripStyle } from "@/lib/types";
import { tripDuration, fmtDateRange } from "@/lib/format";

const STYLES: { id: TripStyle; label: string }[] = [
  { id: "relaxada", label: "Relaxada" },
  { id: "intensa", label: "Intensa" },
  { id: "gastronomica", label: "Gastronômica" },
  { id: "cultural", label: "Cultural" },
  { id: "natureza", label: "Natureza" },
  { id: "compras", label: "Compras" },
];

function initialCoverId(coverUrl: string): string {
  if (coverUrl.startsWith("gallery:")) return coverUrl.slice("gallery:".length);
  return "custom";
}

interface Props {
  trip: Trip;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Trip) => void;
}

export function EditTripModal({ trip, open, onClose, onSaved }: Props) {
  const [name, setName] = useState(trip.name);
  const [country, setCountry] = useState(trip.country);
  const [city, setCity] = useState(trip.city);
  const [origin, setOrigin] = useState(trip.originCity ?? "");
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);
  const [styles, setStyles] = useState<TripStyle[]>(trip.styles);
  const [budget, setBudget] = useState(trip.budget?.toString() ?? "");

  const isCustomCover = !trip.coverUrl.startsWith("gallery:") && trip.coverUrl !== "";
  const [coverId, setCoverId] = useState<string>(initialCoverId(trip.coverUrl));
  const [customCover, setCustomCover] = useState<{ url: string; file: File } | null>(
    isCustomCover ? { url: trip.coverUrl, file: null as unknown as File } : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const duration = start && end ? tripDuration(start, end) : 0;

  const currentCoverUrl = (() => {
    if (coverId === "custom" && customCover) return customCover.url;
    return coverGallery.find((c) => c.id === coverId)?.url ?? "";
  })();

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Limite de 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomCover({ url: reader.result as string, file });
      setCoverId("custom");
    };
    reader.readAsDataURL(file);
  };

  const canSave = name.trim() && country.trim() && city.trim() && start && end &&
    new Date(end) >= new Date(start) && styles.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      let coverUrl: string;
      if (coverId === "custom" && customCover?.file) {
        coverUrl = await storageService.uploadCover(customCover.file);
      } else if (coverId === "custom" && customCover) {
        coverUrl = trip.coverUrl;
      } else {
        coverUrl = `gallery:${coverId}`;
      }

      const updated = await tripsService.update(trip.id, {
        name: name.trim(),
        country: country.trim(),
        city: city.trim(),
        originCity: origin.trim() || undefined,
        startDate: start,
        endDate: end,
        coverUrl,
        styles,
        budget: budget ? Number(budget) : undefined,
      });
      toast.success("Viagem atualizada!");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Editar viagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome da viagem</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mendoza 2026" />
          </div>

          {/* Destino */}
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
            <Label>Cidade de origem</Label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="São Paulo" />
          </div>

          {/* Datas */}
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
          {duration > 0 && (
            <p className="text-sm text-muted-foreground">
              Duração: <span className="font-medium text-foreground">{duration} {duration === 1 ? "dia" : "dias"}</span>
              {start && end && <span className="ml-2">· {fmtDateRange(start, end)}</span>}
            </p>
          )}

          {/* Capa */}
          <div className="space-y-2">
            <Label>Imagem de capa</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
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
              >
                {customCover ? (
                  <>
                    <img src={customCover.url} alt="Capa" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-foreground/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Trocar</span>
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
                    <span className="text-xs text-muted-foreground text-center px-2">Enviar imagem</span>
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
                >
                  <img src={c.url} alt={c.label} className="h-full w-full object-cover" loading="lazy" />
                  {coverId === c.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Estilos */}
          <div className="space-y-2">
            <Label>Estilo da viagem</Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const on = styles.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyles((arr) => on ? arr.filter((x) => x !== s.id) : [...arr, s.id])}
                    className={cn(
                      "rounded-full px-4 py-2 border text-sm font-medium transition-all",
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orçamento */}
          <div className="space-y-2">
            <Label>Orçamento total (R$) <span className="text-muted-foreground font-normal">— opcional</span></Label>
            <Input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex: 5000"
            />
          </div>

          {/* Preview */}
          {currentCoverUrl && (
            <div className="rounded-xl border border-border/50 bg-sunset-soft p-4 flex gap-4 items-center">
              <img src={currentCoverUrl} alt="Capa" className="w-20 h-16 object-cover rounded-lg" />
              <div>
                <p className="font-display font-semibold">{name || "Sem nome"}</p>
                <p className="text-sm text-muted-foreground">{city}{country ? `, ${country}` : ""}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="sunset" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
