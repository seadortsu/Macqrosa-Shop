import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

import { StoreSettingsProvider } from './context/StoreSettingsContext';

// Common Components
import { StorefrontHeader } from './components/common/StorefrontHeader';
import { StorefrontFooter } from './components/common/StorefrontFooter';
import { CartDrawer } from './components/common/CartDrawer';
import { BackToTop } from './components/common/BackToTop';
import { useStoreSettings } from './context/StoreSettingsContext';

// Storefront Pages
import { HomePage } from './pages/storefront/HomePage';
import { CatalogPage } from './pages/storefront/CatalogPage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { OrderConfirmationPage } from './pages/storefront/OrderConfirmationPage';
import { AccountPage } from './pages/storefront/AccountPage';
import { CustomerAuthPage } from './pages/storefront/CustomerAuthPage';
import { CustomerResetPasswordPage } from './pages/storefront/CustomerResetPasswordPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminMediaLibraryPage } from './pages/admin/AdminMediaLibraryPage';
import { AdminMenuBuilderPage } from './pages/admin/AdminMenuBuilderPage';
import { AdminPagesBuilderPage } from './pages/admin/AdminPagesBuilderPage';
import { AdminStoreDesignPage } from './pages/admin/AdminStoreDesignPage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';
import { AdminGatewaysPage } from './pages/admin/AdminGatewaysPage';

// Storefront Layout Wrapper
const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-dark-surface transition-colors duration-300">
      <StorefrontHeader />
      <CartDrawer />
      <main className="flex-1 pt-24 sm:pt-28">
        <Outlet />
      </main>
      <StorefrontFooter />
      <BackToTop />
    </div>
  );
};

// Admin Protected Route Guard
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode, requireSuperAdmin?: boolean }> = ({ children, requireSuperAdmin }) => {
  const { admin, adminToken, isAdminLoading } = useAuth();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-on-surface-variant dark:text-dark-on-surface-variant dark:bg-dark-surface">
        Authenticating Place Vendôme Staff Credentials...
      </div>
    );
  }

  if (!admin || !adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireSuperAdmin && admin.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Maintenance Mode Gate
const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storeSettings } = useStoreSettings();
  
  if (storeSettings?.maintenanceMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface dark:bg-dark-surface text-on-surface p-8 text-center transition-colors duration-300">
        <h1 className="text-3xl font-serif mb-4 text-primary dark:text-dark-primary">Store Under Maintenance</h1>
        <p className="text-lg text-on-surface-variant dark:text-dark-on-surface-variant max-w-md mx-auto">
          We are currently updating our systems to serve you better. Please check back shortly.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
    <AuthProvider>
      <StoreSettingsProvider>
        <CartProvider>
          <BrowserRouter>
          <Routes>
            {/* Storefront Routes */}
            <Route element={<MaintenanceGate><StorefrontLayout /></MaintenanceGate>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:idOrSlug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>

            {/* Independent Storefront Routes */}
            <Route path="/auth" element={<CustomerAuthPage />} />
            <Route path="/reset-password" element={<CustomerResetPasswordPage />} />

            {/* Admin Authentication Portal */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Protected Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminAnalyticsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedAdminRoute>
                  <AdminAnalyticsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedAdminRoute>
                  <AdminProductsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedAdminRoute>
                  <AdminOrdersPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedAdminRoute>
                  <AdminInventoryPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedAdminRoute>
                  <AdminCustomersPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedAdminRoute>
                  <AdminCategoriesPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminNotificationsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdminRoute>
                  <AdminSettingsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/media"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminMediaLibraryPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/menus"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminMenuBuilderPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pages"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminPagesBuilderPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/design"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminStoreDesignPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/team"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminTeamPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/gateways"
              element={
                <ProtectedAdminRoute requireSuperAdmin>
                  <AdminGatewaysPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </StoreSettingsProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
