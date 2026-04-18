import { useEffect, useState } from "react";
import { usersService } from "@/services";
import type { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InterestChip } from "@/components/InterestChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_INTERESTS = ["Animais","Café","Compras","Cultura local","Fitness","Gastronomia","Música ao vivo","Atividades ao ar livre","Caminhadas","Culinária","Filmes","Fotografia","Leitura","Vinho"];
const PACES: { id: "calm" | "balanced" | "intense"; label: string; desc: string }[] = [
  { id: "calm", label: "Tranquila", desc: "Manhãs lentas, café demorado, poucas paradas por dia." },
  { id: "balanced", label: "Equilibrada", desc: "Algo planejado, espaço para improvisar." },
  { id: "intense", label: "Intensa", desc: "Aproveitar cada minuto. Roteiro cheio." },
];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { usersService.get("u-eryca").then((u) => setUser(u || null)); }, []);

  if (!user) return <div className="container py-8"><div className="h-64 shimmer rounded-2xl" /></div>;

  const toggleInterest = (label: string) => {
    setUser({ ...user, interests: user.interests?.includes(label) ? user.interests.filter((x) => x !== label) : [...(user.interests || []), label] });
  };

  const save = async () => {
    await usersService.update(user.id, { name: user.name, bio: user.bio, interests: user.interests, pace: user.pace });
    toast.success("Perfil salvo");
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <header>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">Meu perfil</h1>
        <p className="text-muted-foreground text-sm">Quanto mais o Dusk te conhece, melhor sugere.</p>
      </header>

      <section className="rounded-2xl bg-card border border-border/50 shadow-card p-6 flex gap-5 items-start">
        <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><p className="text-sm text-muted-foreground">{user.email}</p></div>
          <div className="space-y-1.5"><Label>Bio</Label><textarea value={user.bio || ""} onChange={(e) => setUser({ ...user, bio: e.target.value })} className="w-full min-h-[80px] rounded-xl border border-input bg-card p-3 text-sm" /></div>
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border/50 shadow-card p-6 space-y-4">
        <h2 className="font-display font-medium text-lg">Seus interesses</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_INTERESTS.map((i) => (
            <InterestChip key={i} label={i} selected={user.interests?.includes(i)} onToggle={() => toggleInterest(i)} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border/50 shadow-card p-6 space-y-4">
        <h2 className="font-display font-medium text-lg">Ritmo preferido de viagem</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {PACES.map((p) => {
            const on = user.pace === p.id;
            return (
              <button key={p.id} onClick={() => setUser({ ...user, pace: p.id })}
                className={cn("text-left rounded-2xl border p-4 transition-all", on ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40")}>
                <p className="font-display font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">Em breve, o Dusk usará seus interesses para sugerir lugares durante a viagem.</p>

      <div className="flex justify-end"><Button variant="sunset" onClick={save}>Salvar alterações</Button></div>
    </div>
  );
}
