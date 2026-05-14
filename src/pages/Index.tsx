import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type State = "loading" | "in" | "out";

export default function Index() {
  const [state, setState] = useState<State>("loading");
  const seen = typeof window !== "undefined" && localStorage.getItem("dusk:hasSeenIntro");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "in" : "out");
    });
  }, []);

  if (!seen) return <Navigate to="/intro" replace />;
  if (state === "loading") return null;
  return <Navigate to={state === "in" ? "/trips" : "/splash"} replace />;
}
