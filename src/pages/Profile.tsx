import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { profilesService } from "@/services";
import type { User, Gender } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InterestChip } from "@/components/InterestChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, Camera, Loader2 } from "lucide-react";

const ALL_INTERESTS = ["Animais","Café","Compras","Cultura local","Fitness","Gastronomia","Música ao vivo","Atividades ao ar livre","Caminhadas","Culinária","Filmes","Fotografia","Leitura","Vinho"];

const PACES: { id: "calm" | "balanced" | "intense"; label: string; desc: string }[] = [
  { id: "calm", label: "Tranquila", desc: "Manhãs lentas, café demorado, poucas paradas por dia." },
  { id: "balanced", label: "Equilibrada", desc: "Algo planejado, espaço para improvisar." },
  { id: "intense", label: "Intensa", desc: "Aproveitar cada minuto. Roteiro cheio." },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: "feminino", label: "Feminino" },
  { id: "masculino", label: "Masculino" },
  { id: "outro", label: "Outro" },
  { id: "prefiro_nao_dizer", label: "Prefiro não dizer" },
];

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isWelcome = params.get("welcome") === "1";

  useEffect(() => {
    profilesService.getCurrent().then((u) => setUser(u));
  }, []);

  if (!user) return <div className="container py-8"><div className="h-64 shimmer rounded-2xl" /></div>;

  const toggleInterest = (label: string) => {
    setUser({
      ...user,
      interests: user.interests?.includes(label)
        ? user.interests.filter((x) => x !== label)
        : [...(user.interests || []), label],
    });
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await profilesService.uploadAvatar(file);
      const updated = await profilesService.update({ avatarUrl: url });
      setUser(updated);
      toast.success("Foto atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!user.name.trim()) {
      toast.error("Adicione um nome para continuar");
      return;
    }
    setSaving(true);
    try {
      await profilesService.update({
        name: user.name.trim(),
        bio: user.bio,
        interests: user.interests,
        pace: user.pace,
        gender: user.gender,
      });
      toast.success("Perfil salvo");
      if (isWelcome) {
        navigate("/trips", { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = user.avatarUrl ?? `https://i.pravatar.cc/200?u=${user.email}`;

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      {isWelcome && (
        <div className="rounded-2xl bg-sunset-soft border border-primary/20 p-5 flex items-start gap-3 animate-fade-in">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-semibold">Bem-vinda ao Dusk 🌅</p>
            <p className="text-sm text-muted-foreground">
              Antes de começar a planejar, conta um pouco sobre você. Seu nome é essencial; o resto você pode preencher depois.
            </p>
          </div>
        </div>
      )}

      <header>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">
          {isWelcome ? "Complete seu perfil" : "Meu perfil"}
        </h1>
        <p className="text-muted-foreground text-sm">Quanto mais o Dusk te conhece, melhor sugere.</p>
      </header>

      <section className="rounded-2xl bg-card border border-border/50 shadow-card p-6 flex flex-col sm:flex-row gap-5 items-start">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarPick}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group shrink-0"
          aria-label="Trocar foto de perfil"
          disabled={uploading}
        >
          <img
            src={avatarSrc}
            alt={user.name || "Sem foto"}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/60 transition-all"
          />
          <div className={cn(
            "absolute inset-0 rounded-full bg-foreground/55 flex items-center justify-center transition-opacity",
            uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}>
            {uploading
              ? <Loader2 className="h-5 w-5 text-white animate-spin" />
              : <Camera className="h-5 w-5 text-white" />}
          </div>
        </button>

        <div className="flex-1 w-full space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} placeholder="Como você quer ser chamada" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={user.bio || ""}
              onChange={(e) => setUser({ ...user, bio: e.target.value })}
              placeholder="Uma frase sobre você, se quiser"
              className="w-full min-h-[80px] rounded-xl border border-input bg-card p-3 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border/50 shadow-card p-6 space-y-4">
        <h2 className="font-display font-medium text-lg">Gênero</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GENDERS.map((g) => {
            const on = user.gender === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setUser({ ...user, gender: on ? undefined : g.id })}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium transition-all text-center",
                  on ? "border-primary bg-primary/5 shadow-glow text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
                aria-pressed={on}
              >
                {g.label}
              </button>
            );
          })}
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
              <button
                key={p.id}
                type="button"
                onClick={() => setUser({ ...user, pace: p.id })}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-all",
                  on ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <p className="font-display font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">Em breve, o Dusk usará seus interesses para sugerir lugares durante a viagem.</p>

      <div className="flex justify-end">
        <Button variant="sunset" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : isWelcome ? "Salvar e começar" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
