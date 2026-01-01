
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MerchantPaymentPage from "./pages/MerchantPayment";
import MerchantDashboardPage from "./pages/MerchantDashboard";
import StreamlinedCheckoutPage from "./pages/StreamlinedCheckout";
import ListingDetail from "./pages/ListingDetail";
import ProductDetail from "./pages/ProductDetail";
import CustomerCheckout from "./pages/CustomerCheckout";
import WebhookTest from "./pages/WebhookTest";
import TradeCompletion from "./pages/TradeCompletion";
import AdminPanel from "./pages/AdminPanel";
import Trading from "./pages/Trading";
import Onboarding from "./components/Onboarding";
import NotFound from "./pages/NotFound";
import TestAccounts from "./pages/TestAccounts";
import TestingPage from "./pages/TestingPage";
import BarterCustomer from "./pages/BarterCustomer";
import BarterMerchant from "./pages/BarterMerchant";
import ProductDashboard from "./pages/ProductDashboard";
import ResetPassword from "./pages/ResetPassword";
import UnifiedCheckout from "./components/checkout/UnifiedCheckout";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Index />
              </Layout>
            } />
            <Route path="/auth" element={
              <Layout showHeader={false}>
                <Auth />
              </Layout>
            } />
            <Route path="/reset-password" element={
              <Layout showHeader={false}>
                <ResetPassword />
              </Layout>
            } />
            <Route path="/test-accounts" element={
              <Layout>
                <TestAccounts />
              </Layout>
            } />
            <Route path="/testing" element={
              <ProtectedRoute>
                <Layout>
                  <TestingPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/barter-customer" element={
              <ProtectedRoute>
                <Layout>
                  <BarterCustomer />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/barter-merchant" element={
              <ProtectedRoute>
                <Layout>
                  <BarterMerchant />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Layout>
                  <OnboardingPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trading" element={
              <ProtectedRoute>
                <Layout>
                  <Trading />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/listing/:id" element={
              <Layout>
                <ListingDetail />
              </Layout>
            } />
            <Route path="/product/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ProductDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trade-completion/:tradeId" element={
              <ProtectedRoute>
                <Layout>
                  <TradeCompletion />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/merchant-payment" element={
              <ProtectedRoute>
                <Layout>
                  <MerchantPaymentPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/merchant/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <MerchantDashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/merchant/products" element={
              <ProtectedRoute>
                <Layout>
                  <ProductDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/streamlined-checkout" element={
              <ProtectedRoute>
                <Layout>
                  <StreamlinedCheckoutPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout>
                  <UnifiedCheckout />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout/customer" element={
              <ProtectedRoute>
                <Layout>
                  <CustomerCheckout />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/webhook-test" element={
              <ProtectedRoute>
                <Layout>
                  <WebhookTest />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <Layout>
                <NotFound />
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Wrapper component for onboarding
const OnboardingPage = () => {
  return <Onboarding />;
};

export default App;
