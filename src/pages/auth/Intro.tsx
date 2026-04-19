import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";
import { DuskLogo } from "@/components/DuskLogo";
import { Button } from "@/components/ui/button";

// Trail dots distributed along a quadratic Bezier curve that matches the plane's path.
// Each dot fades in with a small delay, giving a "drawn by the plane" feel.
const TRAIL_DOTS = Array.from({ length: 14 }, (_, i) => {
  const t = i / 13;
  const mt = 1 - t;
  // Bezier P0=(-8, 76), P1=(50, 22), P2=(108, -2) — arc up-right
  const x = mt * mt * -8 + 2 * mt * t * 50 + t * t * 108;
  const y = mt * mt * 76 + 2 * mt * t * 22 + t * t * -2;
  return { x, y, delay: 0.3 + i * 0.17 };
});

const STARS = [
  { top: "12%", left: "18%", delay: 1.8 },
  { top: "8%",  left: "64%", delay: 2.0 },
  { top: "22%", left: "82%", delay: 2.2 },
  { top: "30%", left: "30%", delay: 2.3 },
  { top: "16%", left: "48%", delay: 2.5 },
  { top: "36%", left: "72%", delay: 2.6 },
  { top: "42%", left: "12%", delay: 2.8 },
];

export default function Intro() {
  useEffect(() => {
    // Mark as seen on mount — repeat visits skip to /splash via Index route.
    localStorage.setItem("dusk:hasSeenIntro", "1");
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden text-white">
      {/* Sunset sky — base layer */}
      <div className="absolute inset-0 bg-sunset" aria-hidden />

      {/* Night sky — fades in as the plane crosses */}
      <div
        className="absolute inset-0 bg-night"
        aria-hidden
        style={{ animation: "intro-sky-fade 3s ease-in-out both" }}
      />

      {/* Distant stars — appear only once the sky darkens */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full bg-white"
            style={{
              top: s.top,
              left: s.left,
              animation: `intro-star-twinkle 2.4s ease-in-out ${s.delay}s infinite`,
              boxShadow: "0 0 6px hsl(0 0% 100% / 0.8)",
            }}
          />
        ))}
      </div>

      {/* Dotted trail — each dot fades in sequentially behind the plane */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {TRAIL_DOTS.map((d, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              opacity: 0,
              boxShadow: "0 0 4px hsl(0 0% 100% / 0.6)",
              animation: `intro-dot-appear 2s ease-in-out ${d.delay}s both`,
            }}
          />
        ))}
      </div>

      {/* Plane — translate + rotation both come from the keyframe, so the plane follows the curve */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ animation: "intro-plane-fly 2.7s linear 0.2s both" }}
        aria-hidden
      >
        <div
          className="flex items-center justify-center"
          style={{ filter: "drop-shadow(0 4px 16px hsl(0 0% 0% / 0.35))" }}
        >
          <Plane className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content — logo + tagline + action buttons */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-8 text-center">
        <div
          className="opacity-0"
          style={{ animation: "intro-rise-in 0.8s ease-out 0.2s both" }}
        >
          <DuskLogo variant="full" size="xl" onDark />
        </div>

        <p
          className="mt-8 font-brand italic text-lg sm:text-xl text-white/95 max-w-md opacity-0"
          style={{ animation: "intro-rise-in 0.8s ease-out 2.4s both" }}
        >
          para quem encontra sentido no caminho
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 justify-center pt-10 opacity-0"
          style={{ animation: "intro-rise-in 0.8s ease-out 3.1s both" }}
        >
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
