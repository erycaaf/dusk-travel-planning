import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authService } from "@/services";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Intro from "./pages/auth/Intro";
import Splash from "./pages/auth/Splash";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { AppShell } from "./layouts/AppShell";
import Trips from "./pages/Trips";
import NewTrip from "./pages/NewTrip";
import TripDashboard from "./pages/trip/TripDashboard";
import TravelInfo from "./pages/trip/TravelInfo";
import Stay from "./pages/trip/Stay";
import ItineraryPlanner from "./pages/trip/ItineraryPlanner";
import Expenses from "./pages/trip/Expenses";
import Packing from "./pages/trip/Packing";
import Members from "./pages/trip/Members";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Sobre from "./pages/Sobre";
import Notificacoes from "./pages/settings/Notificacoes";
import Privacidade from "./pages/settings/Privacidade";
import Idioma from "./pages/settings/Idioma";
import Invite from "./pages/Invite";

const queryClient = new QueryClient();

/**
 * Listens to Supabase auth state and redirects on sign-in / sign-out.
 * Must live inside <BrowserRouter> so it can use useNavigate.
 */
function AuthWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const subscription = authService.onAuthStateChange((userId) => {
      if (userId) {
        // User just signed in (magic link callback). If we're still on an auth page, move on.
        const onAuthPage = ["/intro", "/splash", "/login", "/signup", "/forgot-password"].some((p) =>
          location.pathname.startsWith(p),
        );
        if (onAuthPage || location.pathname === "/") {
          navigate("/trips", { replace: true });
        }
      } else {
        // User signed out — kick them back to splash.
        const onProtectedPage = location.pathname.startsWith("/trips") ||
          location.pathname.startsWith("/profile") ||
          location.pathname.startsWith("/settings");
        if (onProtectedPage) {
          navigate("/splash", { replace: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWatcher />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* App shell with sidebar/topbar */}
          <Route element={<AppShell />}>
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/new" element={<NewTrip />} />
            <Route path="/trips/:id" element={<TripDashboard />} />
            <Route path="/trips/:id/info" element={<TravelInfo />} />
            <Route path="/trips/:id/stay" element={<Stay />} />
            <Route path="/trips/:id/itinerary" element={<ItineraryPlanner />} />
            <Route path="/trips/:id/expenses" element={<Expenses />} />
            <Route path="/trips/:id/packing" element={<Packing />} />
            <Route path="/trips/:id/members" element={<Members />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/sobre" element={<Sobre />} />
            <Route path="/settings/notificacoes" element={<Notificacoes />} />
            <Route path="/settings/privacidade" element={<Privacidade />} />
            <Route path="/settings/idioma" element={<Idioma />} />
            <Route path="/invite/:code" element={<Invite />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
