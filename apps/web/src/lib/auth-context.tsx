'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { getSocket, disconnectSocket } from './socket';
import type { AuthUser, UserRole } from '@arihant/shared';

export const PRESET_ROLE_USERS: Record<
  UserRole,
  { name: string; email: string; title: string; zone: string; color: string }
> = {
  management: {
    name: 'Rajiv Arihant',
    email: 'mgmt@arihant.com',
    title: 'Managing Director & CEO',
    zone: 'HQ / All India',
    color: 'bg-[#E3EFEE] text-[#0F5E63] border-[#DCD8CE]',
  },
  regional_manager: {
    name: 'Vikram Sharma',
    email: 'regmgr.north@arihant.com',
    title: 'Regional Manager (North Zone)',
    zone: 'North Zone',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  sales: {
    name: 'Amit Verma',
    email: 'sales.delhi@arihant.com',
    title: 'Senior Sales Executive',
    zone: 'Delhi NCR & North',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  tender_team: {
    name: 'Suresh Nair',
    email: 'tender@arihant.com',
    title: 'Tender Operations Lead',
    zone: 'National GeM Cell',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  demo_team: {
    name: 'Ramesh Patel',
    email: 'demo@arihant.com',
    title: 'Demo & Trials Specialist',
    zone: 'North Depot (Delhi)',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  service_team: {
    name: 'Anil Kumar',
    email: 'service@arihant.com',
    title: 'Chief Service Engineer',
    zone: 'North Service Depot',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  accounts: {
    name: 'Kavita Rao',
    email: 'accounts@arihant.com',
    title: 'Head of Finance & Billing',
    zone: 'Corporate Accounts',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  admin: {
    name: 'System Admin',
    email: 'admin@arihant.com',
    title: 'System Administrator',
    zone: 'Infrastructure',
    color: 'bg-gray-100 text-gray-700 border-[#DCD8CE]',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('arihant_auth_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const profile = await api.get<AuthUser>('/auth/me');
      setUser(profile);
      getSocket();
    } catch {
      localStorage.removeItem('arihant_auth_token');
      setUser(null);
      setToken(null);
      disconnectSocket();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const authToken = res.accessToken || res.token;
      localStorage.setItem('arihant_auth_token', authToken);
      if (typeof document !== 'undefined') {
        document.cookie = `arihant_auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `sb-access-token=${authToken}; path=/; max-age=86400; SameSite=Lax`;
      }
      setToken(authToken);
      setUser(res.user);
      getSocket();
      router.push('/dashboard');
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    const preset = PRESET_ROLE_USERS[role];
    if (!preset) return;
    await login(preset.email, 'password123');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('arihant_auth_token');
    if (typeof document !== 'undefined') {
      document.cookie = 'arihant_auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    }
    disconnectSocket();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
