
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MerchantPaymentPage from "./pages/MerchantPayment";
import MerchantDashboardPage from "./pages/MerchantDashboard";
import StreamlinedCheckoutPage from "./pages/StreamlinedCheckout";
import ListingDetail from "./pages/ListingDetail";
import TradeCompletion from "./pages/TradeCompletion";
import AdminPanel from "./pages/AdminPanel";
import Trading from "./pages/Trading";
import Onboarding from "./components/Onboarding";
import NotFound from "./pages/NotFound";
import TestAccounts from "./pages/TestAccounts";
import TestingPage from "./pages/TestingPage";
import BarterCustomer from "./pages/BarterCustomer";
import BarterMerchant from "./pages/BarterMerchant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/test-accounts" element={<TestAccounts />} />
            <Route path="/testing" element={
              <ProtectedRoute>
                <TestingPage />
              </ProtectedRoute>
            } />
            <Route path="/barter-customer" element={
              <ProtectedRoute>
                <BarterCustomer />
              </ProtectedRoute>
            } />
            <Route path="/barter-merchant" element={
              <ProtectedRoute>
                <BarterMerchant />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/trading" element={
              <ProtectedRoute>
                <Trading />
              </ProtectedRoute>
            } />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/trade-completion/:tradeId" element={
              <ProtectedRoute>
                <TradeCompletion />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/merchant-payment" element={
              <ProtectedRoute>
                <MerchantPaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/merchant-dashboard" element={
              <ProtectedRoute>
                <MerchantDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/streamlined-checkout" element={
              <ProtectedRoute>
                <StreamlinedCheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Wrapper component for onboarding
const OnboardingPage = () => {
  return <Onboarding />;
};

export default App;
