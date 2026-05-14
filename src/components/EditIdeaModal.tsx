import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X, Trash2 } from "lucide-react";
import { cn, errorMessage } from "@/lib/utils";
import { itineraryService } from "@/services";
import { toast } from "sonner";
import type { ActivityIdea } from "@/lib/types";

interface Props {
  idea: ActivityIdea;
  onClose: () => void;
  onSaved: (updated: ActivityIdea) => void;
  onDeleted: (ideaId: string) => void;
}

const CATEGORIES: { value: ActivityIdea["category"]; label: string }[] = [
  { value: "vinho", label: "Vinho" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura" },
  { value: "natureza", label: "Natureza" },
  { value: "compras", label: "Compras" },
  { value: "passeio", label: "Passeio" },
  { value: "transporte", label: "Transporte" },
  { value: "outro", label: "Outro" },
];

const PRIORITIES: { value: NonNullable<ActivityIdea["priority"]>; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "med", label: "Média" },
  { value: "high", label: "Alta" },
];

export function EditIdeaModal({ idea, onClose, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState(idea.title);
  const [category, setCategory] = useState<ActivityIdea["category"]>(idea.category);
  const [durationMin, setDurationMin] = useState<number | "">(idea.durationMin);
  const [transitMin, setTransitMin] = useState<number | "">(idea.transitMin ?? "");
  const [estimatedCost, setEstimatedCost] = useState<number | "">(idea.estimatedCost ?? "");
  const [location, setLocation] = useState(idea.location ?? "");
  const [priority, setPriority] = useState<ActivityIdea["priority"]>(idea.priority);
  const [notes, setNotes] = useState(idea.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = title.trim().length > 0 && typeof durationMin === "number" && durationMin > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await itineraryService.updateIdea(idea.id, {
        title: title.trim(),
        category,
        durationMin: Number(durationMin),
        transitMin: transitMin === "" ? undefined : Number(transitMin),
        estimatedCost: estimatedCost === "" ? undefined : Number(estimatedCost),
        location: location.trim() || undefined,
        priority,
        notes: notes.trim() || undefined,
      });
      toast.success("Ideia atualizada.");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar ideia"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Excluir esta ideia? Essa ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      await itineraryService.removeIdea(idea.id);
      toast.success("Ideia excluída.");
      onDeleted(idea.id);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao excluir ideia"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-lift p-6 space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg leading-tight">Editar ideia</h3>
            <p className="text-sm text-muted-foreground">Ajuste os detalhes do passeio.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Bodega Catena Zapata" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ActivityIdea["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duração (minutos)</Label>
              <Input
                type="number" min={0} placeholder="ex: 90 minutos"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Translado (minutos)</Label>
              <Input
                type="number" min={0} placeholder="opcional"
                value={transitMin}
                onChange={(e) => setTransitMin(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Custo estimado (BRL)</Label>
              <Input
                type="number" min={0} step="0.01" placeholder="opcional"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Localização / endereço</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="opcional" />
          </div>

          <div className="space-y-1">
            <Label>Prioridade</Label>
            <div className="inline-flex rounded-full bg-muted p-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                    priority === p.value ? "bg-card shadow-soft text-foreground" : "text-muted-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="opcional" rows={3} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-2">
          <Button
            variant="ghost"
            onClick={remove}
            disabled={deleting || saving}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Excluir ideia
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="sunset" onClick={save} disabled={!canSave || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
