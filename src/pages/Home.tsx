import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./Index";
import WaitingList from "./WaitingList";

const Home = () => {
  const [mode, setMode] = useState<"booking" | "waiting" | null>(null);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("homepage_mode")
          .eq("id", "main")
          .single();

        if (error) {
          // Default to booking if error
          setMode("booking");
          return;
        }
        
        setMode(data?.homepage_mode as "booking" | "waiting" || "booking");
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
