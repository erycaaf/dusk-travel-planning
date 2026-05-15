import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "dusk:privacy_prefs";

type Prefs = {
  showEmail: boolean;
  showProfile: "members" | "nobody";
};

function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      showEmail: saved.showEmail ?? false,
      showProfile: saved.showProfile ?? "members",
    };
  } catch {
    return { showEmail: false, showProfile: "members" };
  }
}

export default function Privacidade() {
  const nav = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const update = (patch: Partial<Prefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Configurações salvas");
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/settings")} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display font-semibold text-2xl">Privacidade</h1>
      </header>

      <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Visibilidade do perfil</p>
        </div>
        <ul className="divide-y divide-border/50">
          <li className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Mostrar email para viajantes</p>
              <p className="text-xs text-muted-foreground">Outros membros da mesma viagem podem ver seu email</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs.showEmail}
              onClick={() => update({ showEmail: !prefs.showEmail })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                prefs.showEmail ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  prefs.showEmail ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </li>
          <li className="px-5 py-4 space-y-3">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Quem pode ver meu perfil</p>
              <p className="text-xs text-muted-foreground">Controla quem vê seu nome, bio e foto fora das viagens</p>
            </div>
            <div className="flex flex-col gap-2">
              {([
                { value: "members", label: "Membros das minhas viagens" },
                { value: "nobody", label: "Só eu" },
              ] as const).map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="showProfile"
                    value={opt.value}
                    checked={prefs.showProfile === opt.value}
                    onChange={() => update({ showProfile: opt.value })}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Seus dados</p>
        </div>
        <ul className="divide-y divide-border/50">
          <li className="px-5 py-4 space-y-1">
            <p className="font-medium text-sm">Dados armazenados</p>
            <p className="text-xs text-muted-foreground">
              O Dusk armazena seu perfil, viagens e preferências no Supabase (servidor na região São Paulo). Nenhum dado é vendido ou compartilhado com terceiros.
            </p>
          </li>
          <li className="px-5 py-4 space-y-1">
            <p className="font-medium text-sm">Excluir conta</p>
            <p className="text-xs text-muted-foreground">
              Para excluir sua conta e todos os dados, entre em contato. Funcionalidade de auto-exclusão em breve.
            </p>
          </li>
        </ul>
      </section>

      <Button variant="sunset" className="w-full" onClick={save}>
        Salvar configurações
      </Button>
    </div>
  );
}
