import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Admin } from '../types';

interface AuthContextType {
  // Customer State
  customer: Customer | null;
  customerToken: string | null;
  isCustomerLoading: boolean;
  loginCustomer: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (data: any) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  refreshCustomer: () => Promise<void>;

  // Admin State (Completely Isolated)
  admin: Admin | null;
  adminToken: string | null;
  isAdminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  updateCustomerProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateAdminProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem('mq_customer_token'));
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('mq_admin_token'));
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  // Initialize and verify customer token
  const refreshCustomer = async () => {
    const token = localStorage.getItem('mq_customer_token');
    if (!token) {
      setCustomer(null);
      setIsCustomerLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/customer/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        localStorage.removeItem('mq_customer_token');
        setCustomerToken(null);
        setCustomer(null);
      }
    } catch (err) {
      console.error('Failed to verify customer token:', err);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  // Initialize and verify admin token
  const refreshAdmin = async () => {
    const token = localStorage.getItem('mq_admin_token');
    if (!token) {
      setAdmin(null);
      setIsAdminLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('mq_admin_token');
        setAdminToken(null);
        setAdmin(null);
      }
    } catch (err) {
      console.error('Failed to verify admin token:', err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomer();
    refreshAdmin();
  }, []);

  // Customer Login
  const loginCustomer = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('mq_customer_token', data.token);
      setCustomerToken(data.token);
      setCustomer(data.customer);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Customer Register
  const registerCustomer = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('mq_customer_token', data.token);
      setCustomerToken(data.token);
      setCustomer(data.customer);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Customer Logout
  const logoutCustomer = () => {
    localStorage.removeItem('mq_customer_token');
    setCustomerToken(null);
    setCustomer(null);
  };

  // Admin Login
  const loginAdmin = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication rejected' };
      }

      localStorage.setItem('mq_admin_token', data.token);
      setAdminToken(data.token);
      setAdmin(data.admin);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error during admin sign in.' };
    }
  };

  // Admin Logout
  const logoutAdmin = () => {
    localStorage.removeItem('mq_admin_token');
    setAdminToken(null);
    setAdmin(null);
  };

  // Update Customer Profile
  const updateCustomerProfile = async (data: any) => {
    try {
      const res = await fetch('/api/auth/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to update profile' };
      }
      setCustomer(result.customer);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Update Admin Profile
  const updateAdminProfile = async (data: any) => {
    try {
      const res = await fetch('/api/auth/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to update admin profile' };
      }
      setAdmin(result.admin);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        customerToken,
        isCustomerLoading,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        refreshCustomer,

        admin,
        adminToken,
        isAdminLoading,
        loginAdmin,
        logoutAdmin,
        updateCustomerProfile,
        updateAdminProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
