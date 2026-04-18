import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Production from "./pages/Production";
import Purchases from "./pages/Purchases";
import DispatchPage from "./pages/Dispatch";
import POS from "./pages/POS";
import WalkInSales from "./pages/WalkInSales";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Accounts from "./pages/Accounts";
import Credits from "./pages/Credits";
import SalesHistory from "./pages/SalesHistory";
import SalesDetails from "./pages/SalesDetails";
import BranchProducts from "./pages/BranchProducts";
import ProductionStock from "./pages/ProductionStock";
import Recipes from "./pages/Recipes";
import SettingsPage from "./pages/Settings";
import BranchSettings from "./pages/BranchSettings";
import LoginPage from "./pages/Login";
import RawMaterialStock from "./pages/RawMaterialStock";
import ProfileSelection from "./pages/ProfileSelection";
import NotFound from "./pages/NotFound";
import type { UserRole } from "@/types";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) => {
  const { currentUser, selectedProfile, isProfileLocked, isLoading } = useApp();
  
  if (isLoading) return null;
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedProfile || isProfileLocked) {
    return <Navigate to="/profiles" replace />;
  }

  const roleToUse = selectedProfile.role;
  if (!allowedRoles.includes(roleToUse)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser, selectedProfile, isProfileLocked, isLoading } = useApp();
  
  if (isLoading) return null;

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profiles" element={
          currentUser ? <ProfileSelection /> : <Navigate to="/login" replace />
        } />
        
        <Route path="/" element={
          !currentUser ? <Navigate to="/login" replace /> :
          (!selectedProfile || isProfileLocked) ? <Navigate to="/profiles" replace /> :
          selectedProfile.role === 'branch_staff' ? (
            <Navigate to={selectedProfile.branchId === 'branch_2' ? '/pos/branch-2' : '/pos/branch-1'} replace />
          ) :
          selectedProfile.role === 'production_manager' ? (
            <Navigate to="/production" replace />
          ) :
          <Dashboard />
        } />
        
        {/* Production Manager & Admin */}
        <Route path="/production" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager']}>
            <Production />
          </ProtectedRoute>
        } />
        <Route path="/raw-materials" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager', 'accountant']}>
            <RawMaterialStock />
          </ProtectedRoute>
        } />
        <Route path="/purchases" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager', 'accountant']}>
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="/dispatch" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager']}>
            <DispatchPage />
          </ProtectedRoute>
        } />

        <Route path="/recipes" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager']}>
            <Recipes />
          </ProtectedRoute>
        } />

        {/* Branch Specific POS */}
        <Route path="/pos/branch-1" element={
          <ProtectedRoute allowedRoles={['admin', 'branch_staff']}>
            {selectedProfile?.role === 'branch_staff' && selectedProfile?.branchId !== 'branch_1' ? (
              <Navigate to="/" replace />
            ) : (
              <POS branch="branch_1" />
            )}
          </ProtectedRoute>
        } />
        <Route path="/pos/branch-2" element={
          <ProtectedRoute allowedRoles={['admin', 'branch_staff']}>
            {selectedProfile?.role === 'branch_staff' && selectedProfile?.branchId !== 'branch_2' ? (
              <Navigate to="/" replace />
            ) : (
              <POS branch="branch_2" />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/walkin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WalkInSales />
          </ProtectedRoute>
        } />

        {/* Accountant & Admin & Branch Staff */}
        <Route path="/sales-history" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant', 'branch_staff']}>
            <SalesHistory />
          </ProtectedRoute>
        } />
        <Route path="/sales-details" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant', 'branch_staff']}>
            <SalesDetails />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/production-stock" element={
          <ProtectedRoute allowedRoles={['admin', 'production_manager']}>
            <ProductionStock />
          </ProtectedRoute>
        } />
        <Route path="/branch-products" element={
          <ProtectedRoute allowedRoles={['admin', 'branch_staff']}>
            <BranchProducts />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant', 'branch_staff']}>
            <Expenses />
          </ProtectedRoute>
        } />
        <Route path="/accounts" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Accounts />
          </ProtectedRoute>
        } />
        <Route path="/credits" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Credits />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/branch-settings" element={
          <ProtectedRoute allowedRoles={['admin', 'branch_staff']}>
            <BranchSettings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
