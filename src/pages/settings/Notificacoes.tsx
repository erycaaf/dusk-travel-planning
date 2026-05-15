import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "dusk:notif_prefs";

const GROUPS = [
  {
    label: "Viagem",
    items: [
      { id: "trip_countdown", label: "Contagem regressiva", description: "Aviso 7 dias e 1 dia antes da viagem começar" },
      { id: "trip_updates", label: "Atualizações dos viajantes", description: "Quando alguém adicionar voo, hospedagem ou despesa" },
    ],
  },
  {
    label: "Checklist",
    items: [
      { id: "packing_reminder", label: "Lembrete de mala", description: "Aviso quando a mala estiver abaixo de 50% embalada a 3 dias da viagem" },
    ],
  },
  {
    label: "Conta",
    items: [
      { id: "new_member", label: "Novo viajante", description: "Quando alguém entrar em uma das suas viagens" },
    ],
  },
];

type Prefs = Record<string, boolean>;

function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function Notificacoes() {
  const nav = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const saved = loadPrefs();
    const defaults: Prefs = {};
    GROUPS.flatMap((g) => g.items).forEach((i) => {
      defaults[i.id] = saved[i.id] ?? true;
    });
    return defaults;
  });

  const toggle = (id: string) => {
    setPrefs((p) => {
      const next = { ...p, [id]: !p[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const saveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Preferências salvas");
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/settings")} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display font-semibold text-2xl">Notificações</h1>
      </header>

      <div className="rounded-2xl bg-muted/40 border border-border/50 px-5 py-3 text-sm text-muted-foreground">
        As notificações são enviadas por email e aparecem no sino do app. Em breve disponíveis como push no celular.
      </div>

      <div className="space-y-5">
        {GROUPS.map((group) => (
          <section key={group.label} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{group.label}</p>
            </div>
            <ul className="divide-y divide-border/50">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={prefs[item.id]}
                    onClick={() => toggle(item.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      prefs[item.id] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                        prefs[item.id] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Button variant="sunset" className="w-full" onClick={saveAll}>
        Salvar preferências
      </Button>
    </div>
  );
}
