import { useEffect, useState } from "react";
import MinimalStepGraduationForm from "@/components/MinimalStepGraduationForm";
import WaitingList from "./WaitingList";
import { supabase } from "@/integrations/supabase/client";

export const Index = ({ isGrad, defaultBatchType }: { isGrad?: boolean; defaultBatchType?: string }) => {
  const [mode, setMode] = useState<"booking" | "waiting" | "loading">("loading");

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("homepage_mode")
          .eq("id", "main")
          .maybeSingle();

        if (data?.homepage_mode === "waiting") {
          setMode("waiting");
        } else {
          setMode("booking");
        }
      } catch (err) {
        console.error("Error fetching homepage mode:", err);
        setMode("booking");
      }
    };

    fetchMode();

    const channel = supabase
      .channel("app_settings_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          if (payload.new && (payload.new as any).id === "main") {
            setMode((payload.new as any).homepage_mode === "waiting" ? "waiting" : "booking");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (mode === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-medium">جاري التحميل...</div>
      </div>
    );
  }

  if (mode === "waiting") {
    return <WaitingList />;
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="container max-w-3xl mx-auto px-3 sm:px-4">
        <MinimalStepGraduationForm />
      </div>
    </div>
  );
};

export default Index;
