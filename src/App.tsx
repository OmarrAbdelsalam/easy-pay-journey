import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Grads from "./pages/Grads";
import Dashboard from "./pages/Dashboard";
import WaitingList from "./pages/WaitingList";
import Home from "./pages/Home";
import CapacityReached from "./pages/CapacityReached";
import MyBooking from "./pages/MyBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Index />} />
          <Route path="/senior" element={<Index defaultBatchType="Senior" />} />
          <Route path="/semi-senior" element={<Index defaultBatchType="Semi-Senior" />} />
          <Route path="/waiting-list" element={<WaitingList />} />
          <Route path="/my-booking" element={<MyBooking />} />
          <Route path="/status" element={<MyBooking />} />
          <Route path="/inquiry" element={<MyBooking />} />
          <Route path="/grads" element={<Grads />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/capacity-reached" element={<CapacityReached />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
