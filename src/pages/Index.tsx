import { Navigate } from "react-router-dom";

export default function Index() {
  // Root redirect: first-time visitors see Intro, otherwise go to splash/trips.
  const seen = typeof window !== "undefined" && localStorage.getItem("dusk:hasSeenIntro");
  const userId = typeof window !== "undefined" && localStorage.getItem("dusk:userId");
  if (!seen) return <Navigate to="/intro" replace />;
  return <Navigate to={userId ? "/trips" : "/splash"} replace />;
}
