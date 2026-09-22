'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Target,
  Calendar,
  Box,
  FileSpreadsheet,
  Wrench,
  Receipt,
  CheckSquare,
  Bell,
  Settings,
  LogOut,
  Compass,
  Activity,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_PROFILES, type UserRole, type BosModuleKey } from '@arihant/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  moduleKey: BosModuleKey | 'reports';
  badge?: string;
  badgeVariant?: 'urgent' | 'cyber' | 'warning' | 'neutral';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Generates custom role-tailored navigation groups and workflows for each of the 8 RBAC personas.
 */
function getRoleNavGroups(role: UserRole): NavGroup[] {
  switch (role) {
    case 'sales':
      return [
        {
          title: 'MY SALES WORKSPACE',
          items: [
            {
              label: 'Sales Field Desk',
              href: '/dashboard',
              icon: Target,
              moduleKey: 'dashboard',
              badge: 'My Deals',
              badgeVariant: 'cyber',
            },
            {
              label: 'My Leads & Accounts',
              href: '/leads',
              icon: Target,
              moduleKey: 'leads',
              badge: 'Active Funnel',
              badgeVariant: 'cyber',
            },
            {
              label: 'Commercial Price Quotes',
              href: '/proposals',
              icon: FileSpreadsheet,
              moduleKey: 'proposals',
            },
          ],
        },
        {
          title: 'FIELD TOURS & DEMOS',
          items: [
            {
              label: 'Client Tour Planner',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
              badge: 'Tour Plan',
              badgeVariant: 'cyber',
            },
            {
              label: 'Demo Equipment Requests',
              href: '/demos',
              icon: Box,
              moduleKey: 'demos',
              badge: 'Trials',
              badgeVariant: 'neutral',
            },
          ],
        },
        {
          title: 'CLAIMS & PRODUCTIVITY',
          items: [
            {
              label: 'Travel Expense Claims',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'My Claims',
              badgeVariant: 'warning',
            },
            {
              label: 'My Tasks & Milestones',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Client Directives & Alerts',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'tender_team':
      return [
        {
          title: 'BID CELL & GeM OPS',
          items: [
            {
              label: 'Tender War Room',
              href: '/dashboard',
              icon: FileText,
              moduleKey: 'dashboard',
              badge: 'Live Bids',
              badgeVariant: 'urgent',
            },
            {
              label: 'GeM Defence Tenders',
              href: '/tenders',
              icon: FileText,
              moduleKey: 'tenders',
              badge: '≤7d Closing',
              badgeVariant: 'urgent',
            },
            {
              label: 'Commercial Bid Proposals',
              href: '/proposals',
              icon: FileSpreadsheet,
              moduleKey: 'proposals',
              badge: 'PQ Docs',
              badgeVariant: 'cyber',
            },
            {
              label: 'Tender Win/Loss Reports',
              href: '/reports',
              icon: FileSpreadsheet,
              moduleKey: 'reports',
              badge: 'L1 Audits',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'OPERATIONAL CONTROL',
          items: [
            {
              label: 'Tender Expenses & EMDs',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'EMD/Claims',
              badgeVariant: 'warning',
            },
            {
              label: 'Bid Milestones & Tasks',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Corrigenda & Bid Alerts',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'demo_team':
      return [
        {
          title: 'DEPOT & TRIALS FLEET',
          items: [
            {
              label: 'Demo Fleet Hub',
              href: '/dashboard',
              icon: Box,
              moduleKey: 'dashboard',
              badge: 'Delhi Depot',
              badgeVariant: 'cyber',
            },
            {
              label: 'Demo Equipment Matrix',
              href: '/demos',
              icon: Box,
              moduleKey: 'demos',
              badge: 'Depot Fleet',
              badgeVariant: 'cyber',
            },
            {
              label: 'Field Trial Visits',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
              badge: 'Trials Tour',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'FIELD DESK & CLAIMS',
          items: [
            {
              label: 'Transit & Freight Expenses',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'Freight',
              badgeVariant: 'warning',
            },
            {
              label: 'Depot Tasks & Handover Logs',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Dispatch Alerts & Directives',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'service_team':
      return [
        {
          title: 'SERVICE & MAINTENANCE',
          items: [
            {
              label: 'Service Support Desk',
              href: '/dashboard',
              icon: Wrench,
              moduleKey: 'dashboard',
              badge: 'SLA Triage',
              badgeVariant: 'urgent',
            },
            {
              label: 'Breakdown Tickets & AMC',
              href: '/service',
              icon: Wrench,
              moduleKey: 'service',
              badge: 'Emergency',
              badgeVariant: 'urgent',
            },
            {
              label: 'On-site Field Visits',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
              badge: 'Repair Tour',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'CLAIMS & WORKFLOW',
          items: [
            {
              label: 'Spares & Travel Expenses',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'Spares/Claims',
              badgeVariant: 'warning',
            },
            {
              label: 'Repair Tasks & Preventive AMC',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Service Alerts & Escalations',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'accounts':
      return [
        {
          title: 'FINANCE & AUDIT',
          items: [
            {
              label: 'Finance & Audit Desk',
              href: '/dashboard',
              icon: Receipt,
              moduleKey: 'dashboard',
              badge: 'Stage-2 Audit',
              badgeVariant: 'warning',
            },
            {
              label: 'Expense Claims & Payouts',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'Payout Audit',
              badgeVariant: 'warning',
            },
            {
              label: 'Financial & Tax Reports',
              href: '/reports',
              icon: FileSpreadsheet,
              moduleKey: 'reports',
              badge: 'GST / Vouchers',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'FINANCIAL COMPLIANCE',
          items: [
            {
              label: 'Audit Tasks & Vouchers',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Disbursement Directives',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'regional_manager':
      return [
        {
          title: 'TERRITORY COMMAND',
          items: [
            {
              label: 'Territory Operations Hub',
              href: '/dashboard',
              icon: Compass,
              moduleKey: 'dashboard',
              badge: 'North Zone',
              badgeVariant: 'cyber',
            },
            {
              label: 'Zonal Command & Scorecard',
              href: '/regional',
              icon: Target,
              moduleKey: 'regional',
              badge: 'Directives',
              badgeVariant: 'cyber',
            },
            {
              label: 'Regional Performance Reports',
              href: '/reports',
              icon: FileSpreadsheet,
              moduleKey: 'reports',
              badge: 'Exports',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'ZONAL PIPELINE',
          items: [
            {
              label: 'Regional GeM Tenders',
              href: '/tenders',
              icon: FileText,
              moduleKey: 'tenders',
              badge: 'Zonal Bids',
              badgeVariant: 'urgent',
            },
            {
              label: 'Territory Leads & CRM',
              href: '/leads',
              icon: Target,
              moduleKey: 'leads',
            },
            {
              label: 'Commercial Proposals',
              href: '/proposals',
              icon: FileSpreadsheet,
              moduleKey: 'proposals',
            },
          ],
        },
        {
          title: 'FIELD DEPLOYMENT',
          items: [
            {
              label: 'Client Tour Planner',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
              badge: 'Also-Meet',
              badgeVariant: 'cyber',
            },
            {
              label: 'Demo Fleet Matrix',
              href: '/demos',
              icon: Box,
              moduleKey: 'demos',
            },
            {
              label: 'Service Support & Spares',
              href: '/service',
              icon: Wrench,
              moduleKey: 'service',
            },
          ],
        },
        {
          title: 'APPROVALS & DIRECTIVES',
          items: [
            {
              label: 'Expense Endorsements',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'Stage 1 RM',
              badgeVariant: 'warning',
            },
            {
              label: 'Tasks & Blocker Escalations',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Zonal Alerts & Directives',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'admin':
      return [
        {
          title: 'SYSTEM ADMINISTRATION',
          items: [
            {
              label: 'System Admin Console',
              href: '/dashboard',
              icon: Settings,
              moduleKey: 'dashboard',
              badge: 'Masters',
              badgeVariant: 'cyber',
            },
            {
              label: 'Users & Security Audit',
              href: '/admin',
              icon: Settings,
              moduleKey: 'admin',
              badge: 'Security',
              badgeVariant: 'urgent',
            },
            {
              label: 'Consolidated Audit Reports',
              href: '/reports',
              icon: FileSpreadsheet,
              moduleKey: 'reports',
              badge: 'System Logs',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'OPERATIONAL REGISTRY',
          items: [
            {
              label: 'Regional Command Hub',
              href: '/regional',
              icon: Compass,
              moduleKey: 'regional',
            },
            {
              label: 'GeM Defence Tenders',
              href: '/tenders',
              icon: FileText,
              moduleKey: 'tenders',
              badge: '30 Live',
              badgeVariant: 'urgent',
            },
            {
              label: 'Leads & CRM Registry',
              href: '/leads',
              icon: Target,
              moduleKey: 'leads',
            },
            {
              label: 'Field Tour Matrix',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
            },
            {
              label: 'Demo Fleet Matrix',
              href: '/demos',
              icon: Box,
              moduleKey: 'demos',
            },
            {
              label: 'Commercial Proposals',
              href: '/proposals',
              icon: FileSpreadsheet,
              moduleKey: 'proposals',
            },
            {
              label: 'Service & Maintenance',
              href: '/service',
              icon: Wrench,
              moduleKey: 'service',
            },
          ],
        },
        {
          title: 'GOVERNANCE & AUDIT',
          items: [
            {
              label: 'Two-Stage Expenses',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
            },
            {
              label: 'Tasks & System Blockers',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'System Alerts & Broadcasts',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];

    case 'management':
    default:
      return [
        {
          title: 'ENTERPRISE COMMAND',
          items: [
            {
              label: 'Executive Command Deck',
              href: '/dashboard',
              icon: Activity,
              moduleKey: 'dashboard',
              badge: 'All India',
              badgeVariant: 'cyber',
            },
            {
              label: 'Regional Territory Command',
              href: '/regional',
              icon: Compass,
              moduleKey: 'regional',
              badge: '4 Zones',
              badgeVariant: 'cyber',
            },
            {
              label: 'Consolidated Reports & Exports',
              href: '/reports',
              icon: FileSpreadsheet,
              moduleKey: 'reports',
              badge: 'Audits',
              badgeVariant: 'cyber',
            },
          ],
        },
        {
          title: 'COMMERCIAL & TENDERS',
          items: [
            {
              label: 'GeM Defence Tenders',
              href: '/tenders',
              icon: FileText,
              moduleKey: 'tenders',
              badge: '30 Live',
              badgeVariant: 'urgent',
            },
            {
              label: 'Enterprise Leads & Accounts',
              href: '/leads',
              icon: Target,
              moduleKey: 'leads',
            },
            {
              label: 'Commercial Proposals & Bids',
              href: '/proposals',
              icon: FileSpreadsheet,
              moduleKey: 'proposals',
            },
          ],
        },
        {
          title: 'FIELD OPERATIONS & ASSETS',
          items: [
            {
              label: 'Client Tour Planner',
              href: '/visits',
              icon: Calendar,
              moduleKey: 'visits',
            },
            {
              label: 'Demo Fleet Matrix',
              href: '/demos',
              icon: Box,
              moduleKey: 'demos',
            },
            {
              label: 'Service Desk & Spares',
              href: '/service',
              icon: Wrench,
              moduleKey: 'service',
            },
          ],
        },
        {
          title: 'GOVERNANCE & AUDIT',
          items: [
            {
              label: 'Expense Claims & Sign-offs',
              href: '/expenses',
              icon: Receipt,
              moduleKey: 'expenses',
              badge: 'Stage 1 & 2',
              badgeVariant: 'warning',
            },
            {
              label: 'Tasks & Milestone Blockers',
              href: '/tasks',
              icon: CheckSquare,
              moduleKey: 'tasks',
            },
            {
              label: 'Administration & Masters',
              href: '/admin',
              icon: Settings,
              moduleKey: 'admin',
              badge: 'System',
              badgeVariant: 'cyber',
            },
            {
              label: 'Directives & Broadcasts',
              href: '/notifications',
              icon: Bell,
              moduleKey: 'notifications',
            },
          ],
        },
      ];
  }
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role || 'management';
  const roleProfile = ROLE_PROFILES[role];
  const navGroups = getRoleNavGroups(role);

  // RBAC clearance validation
  const isModuleAllowed = (moduleKey: BosModuleKey | 'reports') => {
    if (!user) return false;
    if (moduleKey === 'reports') {
      return ['management', 'regional_manager', 'tender_team', 'accounts', 'admin'].includes(user.role);
    }
    return roleProfile?.allowedModules?.includes(moduleKey as BosModuleKey);
  };

  return (
    <aside className="w-72 min-h-screen bg-white border-r border-[#D6E3F5] flex flex-col justify-between shrink-0 z-20 select-none shadow-xs text-[#1A1A1A]">
      <div className="flex flex-col h-full">
        {/* Brand Insignia Header */}
        <div className="h-[64px] px-5 border-b border-[#D6E3F5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-[#223FA7] flex items-center justify-center text-white shadow-xs shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[#1A1A1A] text-sm tracking-tight flex items-center gap-1.5">
                <span>ARIHANT</span>
                <span className="text-[#223FA7] font-extrabold text-xs px-1.5 py-0.2 rounded bg-[#EAF2FF] border border-[#D6E3F5]">
                  BOS
                </span>
              </div>
              <div className="text-[10px] text-[#5871A5] font-medium truncate">
                Defence GeM Portal
              </div>
            </div>
          </div>

          <div className="flex items-center shrink-0" title="Security Clearance Active">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
              Verified
            </span>
          </div>
        </div>
        {/* Dynamic Role Navigation Items */}
        <nav className="px-2 py-3 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {navGroups.map((group) => {
            // Filter strictly by RBAC module permission
            const visibleItems = group.items.filter((item) => isModuleAllowed(item.moduleKey));

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-0.5">
                <div className="px-3 text-[10px] font-bold text-[#5871A5] uppercase tracking-wider mb-1">
                  {group.title}
                </div>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className={`flex items-center justify-between py-2 text-[13px] transition-colors rounded-lg px-3 min-w-0 max-w-full ${
                        isActive
                          ? 'bg-[#EAF2FF] text-[#223FA7] font-semibold border-r-2 border-[#223FA7]'
                          : 'text-gray-600 hover:bg-[#F7FBFF] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-1.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#223FA7]' : 'text-gray-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                              item.badgeVariant === 'urgent'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : item.badgeVariant === 'neutral'
                                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                : 'bg-[#EAF2FF] text-[#223FA7] border border-[#D6E3F5]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / Status / Logout */}
      <div className="p-3 border-t border-[#D6E3F5] bg-[#F7FBFF] space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-[#5871A5] px-1 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GeM Gateway: Online</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Connected</span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-red-700 hover:bg-red-50 border border-[#D6E3F5] transition-colors min-w-0 truncate"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
