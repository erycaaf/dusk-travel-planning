import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { tripsService } from "@/services";
import type { Trip, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleTone: Record<UserRole, string> = {
  owner: "bg-primary text-primary-foreground",
  editor: "bg-secondary/15 text-secondary",
  viewer: "bg-muted text-muted-foreground",
};
const roleLabel: Record<UserRole, string> = { owner: "Dono", editor: "Editor", viewer: "Visualizador" };

export default function Members() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (!id) return;
    tripsService.get(id).then((t) => setTrip(t || null));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!trip) return <div className="container py-8"><div className="h-64 shimmer rounded-2xl" /></div>;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl">Viajantes</h1>
          <p className="text-muted-foreground text-sm">Quem está nessa com você.</p>
        </div>
        <Button variant="sunset" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Convidar</Button>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {trip.members.map((m) => {
          const u = m.profile;
          if (!u) return null;
          const fallbackAvatar = u.avatarUrl ?? `https://i.pravatar.cc/200?u=${u.email}`;
          return (
            <article key={m.userId} className="rounded-2xl bg-card border border-border/50 shadow-card p-5 flex gap-4 items-start">
              <img src={fallbackAvatar} alt={u.name || u.email} className="w-16 h-16 rounded-full object-cover" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold">{u.name || "Sem nome"}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", roleTone[m.role])}>{roleLabel[m.role]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                {u.interests && u.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {u.interests.slice(0, 4).map((i) => <span key={i} className="text-[11px] rounded-full bg-muted px-2 py-0.5">{i}</span>)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <InviteModal
          tripId={trip.id}
          onClose={() => setOpen(false)}
          onInvited={() => { setOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function InviteModal({ tripId, onClose, onInvited }: { tripId: string; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    setLoading(true);
    try {
      await tripsService.addMemberByEmail(tripId, email, role);
      toast.success(`${email} adicionado à viagem`);
      onInvited();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao convidar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lift p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Convidar viajante</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A pessoa precisa ter entrado no Dusk pelo menos uma vez pra ser adicionada.
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amigo@email.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Papel</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="h-11 w-full rounded-full border border-input bg-card px-3 text-sm">
              <option value="editor">Editor — pode adicionar e editar</option>
              <option value="viewer">Visualizador — apenas vê</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="sunset" onClick={invite} disabled={!email || loading}>
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
