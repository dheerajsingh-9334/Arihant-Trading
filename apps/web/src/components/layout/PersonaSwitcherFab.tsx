'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { ROLE_PROFILES, type UserRole } from '@arihant/shared';
import { IconButton } from '@/components/ui';
import {
  Shield,
  ShieldCheck,
  MapPin,
  Check,
  UserCheck,
  X,
  ChevronUp,
} from 'lucide-react';

const ROLE_CAPABILITY_TAGS: Record<UserRole, string[]> = {
  management: ['All-India Scope', 'Tender Signoff', 'Stage 1 & 2 Payouts'],
  regional_manager: ['North Zone Command', 'Stage-1 Endorse', 'Also-Meet Directives'],
  sales: ['Delhi NCR Pipeline', 'Tour Itinerary', 'Quotation Prep'],
  tender_team: ['National GeM Cell', 'Bid Prep & PQ', 'EMD Tracking'],
  demo_team: ['North Depot Fleet', 'Trials Dispatch', 'Gate-Pass Handover'],
  service_team: ['National Service Desk', 'Breakdown SLAs', 'Spares Coordination'],
  accounts: ['Corporate Accounts', 'Stage-2 Payouts', 'GST & Bank Audit'],
  admin: ['Platform Admin', 'User Provisioning', 'Master Data & RBAC'],
};

export const PersonaSwitcherFab: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const role = user.role;
  const roleProfile = ROLE_PROFILES[role];
  const capabilityTags = ROLE_CAPABILITY_TAGS[role] || [];
  const presetInfo = PRESET_ROLE_USERS[user.role];

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-none">
      {/* Floating Popup Modal / Card */}
      {isOpen && (
        <div
          className="mb-3 w-84 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#D6E3F5] shadow-2xl p-4 text-xs text-[#1A1A1A] animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{ boxShadow: '0 20px 40px -15px rgba(34, 63, 167, 0.15), 0 0 0 1px rgba(214, 227, 245, 0.8)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#D6E3F5]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#5871A5] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#223FA7]" />
                Persona Clearance
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate ${
                  presetInfo?.color || 'bg-[#EAF2FF] text-[#223FA7] border-[#D6E3F5]'
                }`}
              >
                {user.role.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <IconButton
              icon={<X className="w-3.5 h-3.5" />}
              aria-label="Close Persona Switcher"
              size="xs"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* User Details */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#1A1A1A] text-sm truncate">{user.full_name}</div>
              <span className="text-[10px] text-[#5871A5] font-medium">{presetInfo?.title}</span>
            </div>
            <div className="text-[11px] text-[#5871A5] truncate">{user.email}</div>

            {/* Territory / Zone Tag */}
            {presetInfo?.zone && (
              <div className="mt-2 flex items-center text-[10px] font-semibold text-[#223FA7] gap-1.5 bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg px-2 py-1">
                <MapPin className="w-3 h-3 text-[#223FA7] shrink-0" />
                <span className="truncate">{presetInfo.zone}</span>
              </div>
            )}

            {/* Scope Summary Quote */}
            {roleProfile && (
              <div className="mt-2 text-[11px] text-gray-700 bg-[#F7FBFF]/60 border border-[#D6E3F5] rounded-lg px-2.5 py-1.5 leading-snug font-medium italic">
                &ldquo;{roleProfile.scopeSummary}&rdquo;
              </div>
            )}

            {/* Role Capabilities Chips */}
            {capabilityTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {capabilityTags.map((cap, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF2FF] text-[#223FA7] border border-[#D6E3F5]"
                  >
                    <Check className="w-2.5 h-2.5 mr-1 text-[#223FA7]" />
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Switch Dropdown */}
          <div className="mt-3.5 pt-3 border-t border-[#D6E3F5] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#5871A5]">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#223FA7]" /> Persona Switcher
              </span>
              <span className="text-[10px] text-[#223FA7] font-bold bg-[#EAF2FF] px-1.5 py-0.2 rounded border border-[#D6E3F5]">
                8 Roles Available
              </span>
            </div>

            <select
              value={user.role}
              onChange={(e) => {
                switchRole(e.target.value as UserRole);
              }}
              className="w-full bg-white text-[#1A1A1A] text-xs rounded-xl border border-[#D6E3F5] px-3 py-2 font-medium focus:border-[#223FA7] focus:ring-1 focus:ring-[#223FA7] focus:outline-none cursor-pointer shadow-xs"
            >
              {Object.entries(PRESET_ROLE_USERS).map(([roleKey, info]) => (
                <option key={roleKey} value={roleKey}>
                  {info.name} — {info.title} ({roleKey.toUpperCase().replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Floating Action Button (Trigger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Toggle Persona Clearance & Role Switcher"
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#D6E3F5] shadow-lg hover:shadow-xl hover:border-[#223FA7]/50 transition-all duration-200 group text-left cursor-pointer active:scale-98"
        style={{ boxShadow: '0 8px 24px -6px rgba(34, 63, 167, 0.18)' }}
      >
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#223FA7] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-[#5871A5] uppercase tracking-wider leading-none">
              Clearance
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border leading-none ${
                presetInfo?.color || 'bg-[#EAF2FF] text-[#223FA7] border-[#D6E3F5]'
              }`}
            >
              {user.role.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <span className="text-xs font-bold text-[#1A1A1A] truncate max-w-[150px] mt-0.5 leading-tight">
            {presetInfo?.name || user.full_name}
          </span>
        </div>

        <div className="pl-1 border-l border-[#D6E3F5]/60 text-[#5871A5] group-hover:text-[#223FA7] transition-colors">
          <ChevronUp
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#223FA7]' : ''}`}
          />
        </div>
      </button>
    </div>
  );
};
