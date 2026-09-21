'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Shield, ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { PersonaSwitcherFab } from '@/components/layout/PersonaSwitcherFab';
import type { UserRole } from '@arihant/shared';

const ROUTE_PERMISSIONS: { path: string; name: string; roles: UserRole[] }[] = [
  { path: '/regional', name: 'Regional Territory Command', roles: ['regional_manager', 'management', 'admin'] },
  { path: '/tenders', name: 'GeM Defence Tenders', roles: ['management', 'regional_manager', 'tender_team', 'admin'] },
  { path: '/leads', name: 'Leads & CRM Accounts', roles: ['management', 'regional_manager', 'sales', 'admin'] },
  { path: '/visits', name: 'Field Tour Planner', roles: ['management', 'regional_manager', 'sales', 'demo_team', 'service_team', 'admin'] },
  { path: '/demos', name: 'Demo Fleet Matrix', roles: ['management', 'regional_manager', 'sales', 'demo_team', 'admin'] },
  { path: '/proposals', name: 'Commercial Proposals', roles: ['management', 'regional_manager', 'sales', 'tender_team', 'admin'] },
  { path: '/service', name: 'Service Desk & Spares', roles: ['management', 'regional_manager', 'service_team', 'admin'] },
  { path: '/reports', name: 'Consolidated Reporting & Exports', roles: ['management', 'regional_manager', 'tender_team', 'accounts', 'admin'] },
  { path: '/admin', name: 'Administration & System Audit', roles: ['management', 'admin'] },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FBFF] flex flex-col items-center justify-center space-y-3">
        <div className="h-12 w-12 rounded-xl bg-[#223FA7] flex items-center justify-center shadow-md animate-pulse">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <p className="text-xs font-semibold text-[#5871A5] tracking-wider uppercase">
          Loading Arihant BOS...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Route-Level Security Guard Check
  const restrictedRoute = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.path || pathname.startsWith(r.path + '/'),
  );
  const isUnauthorized =
    restrictedRoute && !restrictedRoute.roles.includes(user.role);

  return (
    <div className="min-h-screen bg-[#F7FBFF] flex flex-row text-[#1A1A1A]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenCommand={() => setIsCommandOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F7FBFF]">
          {isUnauthorized ? (
            <div className="max-w-2xl mx-auto my-12 bg-white border border-amber-200 rounded-2xl p-8 shadow-xs text-center space-y-5">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                <ShieldAlert className="h-7 w-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                  403 — Access Denied
                </span>
                <h2 className="text-xl font-bold text-[#1A1A1A] mt-2">
                  Restricted Operational Domain
                </h2>
                <p className="text-xs text-[#5871A5] mt-1.5 max-w-md mx-auto leading-relaxed">
                  Your active role (
                  <span className="font-semibold text-[#1A1A1A]">
                    {user.role.toUpperCase().replace('_', ' ')}
                  </span>
                  ) does not have clearance to view or operate in{' '}
                  <span className="font-semibold text-[#223FA7]">
                    {restrictedRoute.name}
                  </span>
                  .
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-left max-w-md mx-auto">
                <div className="text-[10px] font-bold text-[#5871A5] uppercase tracking-wider mb-1">
                  Permitted Clearances for this Domain
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {restrictedRoute.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded bg-white border border-[#D6E3F5] text-[11px] font-medium text-gray-700 capitalize"
                    >
                      {r.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Return to Executive Deck</span>
                </Button>

                <div className="flex items-center gap-2 bg-[#F7FBFF] px-3 py-1.5 rounded-lg border border-[#D6E3F5]">
                  <UserCheck className="h-4 w-4 text-[#223FA7]" />
                  <span className="text-xs font-medium text-gray-700">Switch Role:</span>
                  <select
                    value={user.role}
                    onChange={(e) => switchRole(e.target.value as UserRole)}
                    className="bg-white text-[#1A1A1A] text-xs rounded border border-[#D6E3F5] px-2 py-1 font-medium focus:border-[#3770E3] focus:outline-none"
                  >
                    {Object.entries(PRESET_ROLE_USERS).map(([roleKey, info]) => (
                      <option key={roleKey} value={roleKey}>
                        {info.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
      <PersonaSwitcherFab />
    </div>
  );
}
