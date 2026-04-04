import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./Index";
import WaitingList from "./WaitingList";

const MAX_TEAMS = 40;

const Home = () => {
  const [mode, setMode] = useState<"booking" | "waiting" | null>(null);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        // Check manual mode setting
        const { data: settings } = await supabase
          .from("app_settings")
          .select("homepage_mode")
          .eq("id", "main")
          .single();

        const manualMode = settings?.homepage_mode as "booking" | "waiting" || "booking";

        // If already set to waiting manually, respect that
        if (manualMode === "waiting") {
          setMode("waiting");
          return;
        }

        // Count approved + pending tournament registrations (batch 4)
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("booking_type", "tournament")
          .eq("batch", 4)
          .neq("status", "rejected");

        if ((count ?? 0) >= MAX_TEAMS) {
          setMode("waiting");
        } else {
          setMode("booking");
        }
      } catch {
        setMode("booking");
      }
    };

    fetchMode();
  }, []);

  if (mode === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return mode === "booking" ? <Index /> : <WaitingList />;
};

export default Home;
