import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "dusk:lang";

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", available: true },
  { code: "en", label: "English", available: false },
  { code: "es", label: "Español", available: false },
];

export default function Idioma() {
  const nav = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "pt-BR");

  const save = () => {
    localStorage.setItem(STORAGE_KEY, lang);
    toast.success("Idioma salvo");
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/settings")} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display font-semibold text-2xl">Idioma</h1>
      </header>

      <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <ul className="divide-y divide-border/50">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                disabled={!l.available}
                onClick={() => l.available && setLang(l.code)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors",
                  l.available ? "hover:bg-muted/50 cursor-pointer" : "opacity-40 cursor-not-allowed",
                  lang === l.code && l.available && "bg-primary/5",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{l.label}</span>
                  {!l.available && (
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">em breve</span>
                  )}
                </div>
                {lang === l.code && l.available && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Button variant="sunset" className="w-full" onClick={save}>
        Salvar
      </Button>
    </div>
  );
}
