import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, User, Bell, Lock, Languages, Info, LogOut } from "lucide-react";
import { authService } from "@/services";
import { toast } from "sonner";

const items = [
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/settings/notificacoes", label: "Notificações", icon: Bell },
  { to: "/settings/privacidade", label: "Privacidade", icon: Lock },
  { to: "/settings/idioma", label: "Idioma", icon: Languages },
  { to: "/settings/sobre", label: "Sobre o Dusk", icon: Info },
];

export default function Settings() {
  const nav = useNavigate();
  const signOut = async () => {
    await authService.signOut();
    toast.success("Até logo ✨");
    nav("/splash", { replace: true });
  };
  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header><h1 className="font-display font-semibold text-2xl sm:text-3xl">Ajustes</h1></header>
      <ul className="rounded-2xl bg-card border border-border/50 divide-y divide-border/60 overflow-hidden">
        {items.map((it) => (
          <li key={it.label}>
            <Link to={it.to} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors">
              <span className="rounded-xl bg-muted/60 p-2"><it.icon className="h-4 w-4 text-foreground" /></span>
              <span className="flex-1 font-medium">{it.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li>
          <button onClick={signOut} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-destructive/5 text-destructive transition-colors">
            <span className="rounded-xl bg-destructive/10 p-2"><LogOut className="h-4 w-4" /></span>
            <span className="flex-1 font-medium text-left">Sair</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
