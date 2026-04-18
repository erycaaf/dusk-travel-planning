import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DuskLogo } from "@/components/DuskLogo";
import { authService } from "@/services";

const EPIGRAPH_LINES = [
  "Do lado de fora, a chuva molha as folhas;",
  "Cristas brancas nas ondas do oceano; espuma do mar na praia;",
  "O entendimento é a luz da humanidade.",
];

export default function Intro() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => goNext(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = async () => {
    localStorage.setItem("dusk:hasSeenIntro", "1");
    const u = await authService.getCurrent();
    navigate(u ? "/trips" : "/splash", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={goNext}
      className="fixed inset-0 bg-sunset text-white flex flex-col items-center justify-between py-16 px-8 cursor-pointer"
      aria-label="Continuar"
    >
      <div className={`pt-10 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
        <DuskLogo variant="full" size="xl" onDark />
      </div>

      <div className={`max-w-xl text-center space-y-6 transition-all duration-1000 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <blockquote className="font-display italic font-light text-xl sm:text-2xl leading-relaxed text-white/95">
          {EPIGRAPH_LINES.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </blockquote>
        <cite className="block text-sm text-white/70 not-italic">
          — tradição galesa, em Juliette Wood,<br />
          <span className="italic">The Celtic Book of Living and Dying</span>
        </cite>
      </div>

      <p className={`text-xs text-white/60 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
        toque para continuar
      </p>
    </button>
  );
}
