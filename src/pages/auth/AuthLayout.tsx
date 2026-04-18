import { ReactNode } from "react";
import { DuskLogo } from "@/components/DuskLogo";
import authCover from "@/assets/auth-cover.jpg";
import { Link } from "react-router-dom";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-background">
      {/* Form side */}
      <div className="flex flex-col px-6 sm:px-12 py-10">
        <Link to="/" aria-label="Início"><DuskLogo variant="full" size="md" /></Link>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="font-display font-semibold text-3xl">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">© Dusk · planejado com carinho</p>
      </div>

      {/* Cover side */}
      <div className="hidden lg:block relative">
        <img src={authCover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-sunset opacity-65" />
        <div className="absolute inset-0 bg-foreground/15" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <p className="font-display italic text-lg max-w-xs">para quem encontra sentido no caminho</p>
          <div>
            <p className="font-display font-semibold text-3xl leading-snug max-w-md">
              Colecione lugares,<br />sentidos e memórias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
