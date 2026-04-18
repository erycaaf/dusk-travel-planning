import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
