import { Link } from "react-router-dom";
import { DuskLogo } from "@/components/DuskLogo";
import { Button } from "@/components/ui/button";

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-sunset flex flex-col items-center justify-center text-white px-8 text-center">
      <div className="absolute inset-0 bg-foreground/15" aria-hidden />
      <div className="relative space-y-8 animate-fade-in">
        <DuskLogo variant="full" size="xl" onDark />
        <p className="font-display italic font-light text-lg sm:text-xl text-white/95 max-w-md">
          para quem encontra sentido no caminho
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90 hover:shadow-lift min-w-[160px]">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-white border border-white/40 hover:bg-white/10 min-w-[160px]">
            <Link to="/signup">Criar conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
