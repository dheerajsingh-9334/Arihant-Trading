'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@arihant/shared';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoleKey, setActiveRoleKey] = useState<UserRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRoleSelect = (role: UserRole) => {
    setActiveRoleKey(role);
    setEmail(PRESET_ROLE_USERS[role].email);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#F7FBFF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none text-[#1A1A1A]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <div className="h-14 w-14 rounded-2xl bg-[#223FA7] flex items-center justify-center text-white shadow-md">
            <Shield className="h-7 w-7" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A] flex items-center justify-center gap-2">
          <span>Arihant</span>
          <span className="text-[#223FA7] font-extrabold px-2 py-0.5 rounded-md bg-[#EAF2FF] border border-[#D6E3F5] text-xl">
            BOS
          </span>
        </h2>
        <p className="mt-1 text-xs text-[#5871A5] font-medium">
          Defence & Security GeM Enterprise Operations
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Credentials Card */}
          <div className="lg:col-span-5 rounded-xl bg-white border border-[#D6E3F5] p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Sign In
                </h3>
                <span className="text-[10px] font-semibold text-[#223FA7] bg-[#EAF2FF] px-2 py-0.5 rounded border border-[#D6E3F5]">
                  GeM v2.4
                </span>
              </div>
              <p className="text-xs text-[#5871A5] mb-5">
                Enter your official credentials or select a test role on the right.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Official Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@arihant.com"
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-semibold text-xs"
                    isLoading={isLoading}
                  >
                    <span>Log In to Dashboard</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D6E3F5] text-center">
              <span className="text-[11px] text-[#5871A5]">
                Arihant Trading Corporation &bull; All Rights Reserved
              </span>
            </div>
          </div>

          {/* Persona Switcher (8 Roles) */}
          <div className="lg:col-span-7 rounded-xl bg-white border border-[#D6E3F5] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-[#223FA7]" />
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                    1-Click Role Personas
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#5871A5] bg-[#F7FBFF] px-2 py-0.5 rounded border border-[#D6E3F5]">
                  PW: password123
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {(Object.keys(PRESET_ROLE_USERS) as UserRole[]).map((roleKey) => {
                  const info = PRESET_ROLE_USERS[roleKey];
                  const isSelected = activeRoleKey === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleQuickRoleSelect(roleKey)}
                      className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#EAF2FF] border-[#223FA7] shadow-xs'
                          : 'bg-[#F7FBFF] border-[#D6E3F5] hover:bg-[#EAF2FF]/50 hover:border-[#9FC0F5]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-[#1A1A1A]">
                            {info.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#223FA7] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#5871A5] truncate">
                          {info.title}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-[#D6E3F5]/60 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 truncate">
                          {info.zone}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-white text-[#223FA7] border border-[#D6E3F5]">
                          {roleKey.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-[11px] text-[#5871A5] text-center font-medium">
              Click any role persona to fill credentials and test permissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
