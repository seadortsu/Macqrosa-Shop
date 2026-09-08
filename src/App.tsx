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

// Storefront Pages
import { HomePage } from './pages/storefront/HomePage';
import { CatalogPage } from './pages/storefront/CatalogPage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { OrderConfirmationPage } from './pages/storefront/OrderConfirmationPage';
import { AccountPage } from './pages/storefront/AccountPage';
import { CustomerAuthPage } from './pages/storefront/CustomerAuthPage';

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
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:idOrSlug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/auth" element={<CustomerAuthPage />} />
            </Route>

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
                <ProtectedAdminRoute>
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
