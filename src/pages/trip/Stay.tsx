import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { staysService, storageService } from "@/services";
import type { Stay, StayType } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X, Trash2, Paperclip, ExternalLink } from "lucide-react";
import { cn, errorMessage } from "@/lib/utils";
import { toast } from "sonner";

const STAY_TYPES: { id: StayType; label: string }[] = [
  { id: "hotel", label: "Hotel" },
  { id: "airbnb", label: "Airbnb" },
  { id: "booking", label: "Booking" },
  { id: "hostel", label: "Hostel" },
  { id: "other", label: "Outro" },
];

const EMPTY_FORM = {
  name: "",
  type: "hotel" as StayType,
  address: "",
  checkIn: "",
  checkOut: "",
  bookingCode: "",
};

export default function StayPage() {
  const { id } = useParams();
  const [stays, setStays] = useState<Stay[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetId = useRef<string | null>(null);

  const handleReceiptPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId.current) return;
    const stayId = uploadTargetId.current;
    setUploadingFor(stayId);
    try {
      const url = await storageService.uploadAttachment(file);
      await staysService.updateReceipt(stayId, url);
      setStays((prev) => prev.map((s) => s.id === stayId ? { ...s, receiptUrl: url } : s));
      toast.success("Comprovante anexado!");
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao enviar comprovante"));
    } finally {
      setUploadingFor(null);
      uploadTargetId.current = null;
      e.target.value = "";
    }
  };

  const load = () => {
    if (!id) return;
    staysService.byTrip(id).then(setStays).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const field = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSave = form.name && form.checkIn && form.checkOut;

  const save = async () => {
    if (!id || !canSave) return;
    setSaving(true);
    try {
      await staysService.add({
        tripId: id,
        name: form.name,
        type: form.type,
        address: form.address || undefined,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        bookingCode: form.bookingCode || undefined,
      });
      toast.success("Hospedagem adicionada!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar hospedagem"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (stayId: string) => {
    try {
      await staysService.remove(stayId);
      setStays((prev) => prev.filter((s) => s.id !== stayId));
      toast.success("Hospedagem removida.");
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao remover hospedagem"));
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl">Hospedagem</h1>
          <p className="text-muted-foreground text-sm">Onde você vai descansar entre uma aventura e outra.</p>
        </div>
        {!showForm && (
          <Button variant="sunset" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        )}
      </header>

      {showForm && (
        <div className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">Nova hospedagem</p>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2">
              {STAY_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm border transition-all",
                    form.type === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nome do local</Label>
              <Input value={form.name} onChange={field("name")} placeholder="Hotel Fuente Mayor" />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={field("address")} placeholder="Rua, número, cidade" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Check-in</Label>
              <Input type="datetime-local" value={form.checkIn} onChange={field("checkIn")} />
            </div>
            <div className="space-y-1">
              <Label>Check-out</Label>
              <Input type="datetime-local" value={form.checkOut} onChange={field("checkOut")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Código de reserva</Label>
            <Input value={form.bookingCode} onChange={field("bookingCode")} placeholder="XYZ9876" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button variant="sunset" onClick={save} disabled={!canSave || saving}>
              {saving ? "Salvando..." : "Salvar hospedagem"}
            </Button>
          </div>
        </div>
      )}

      {stays.length === 0 && !showForm && (
        <div className="rounded-2xl bg-card border border-border/50 p-8 text-center text-muted-foreground">
          Nenhuma hospedagem cadastrada ainda.
        </div>
      )}

      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleReceiptPick}
      />

      {stays.map((s) => (
        <article key={s.id} className="rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-medium uppercase">{s.type}</span>
                <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" aria-label="Remover hospedagem">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h2 className="font-display font-semibold text-xl">{s.name}</h2>
              {s.address && <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {s.address}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="font-medium">{fmtDate(s.checkIn)} · {fmtTime(s.checkIn)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Check-out</p>
                  <p className="font-medium">{fmtDate(s.checkOut)} · {fmtTime(s.checkOut)}</p>
                </div>
              </div>
              {s.bookingCode && <p className="text-sm"><span className="text-muted-foreground">Reserva: </span><span className="font-mono">{s.bookingCode}</span></p>}
              <div className="flex gap-2">
                {s.receiptUrl ? (
                  <a href={s.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" /> Ver comprovante
                    </Button>
                  </a>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingFor === s.id}
                  onClick={() => { uploadTargetId.current = s.id; receiptInputRef.current?.click(); }}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {uploadingFor === s.id ? "Enviando..." : s.receiptUrl ? "Trocar comprovante" : "Anexar comprovante"}
                </Button>
              </div>
            </div>
            <div className="p-6">
              <MapPlaceholder pins={[{ id: "stay", label: s.name, x: 50, y: 50, tone: "primary" }]} height={260} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
