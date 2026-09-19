'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  Target,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  Wrench,
  ChevronRight,
  Radio,
  Zap,
  Shield,
  Layers,
  Award,
  Box,
  CheckSquare,
  Compass,
  Settings,
  Users,
  Key,
  Briefcase,
  MapPin,
  HelpCircle,
  Truck,
  Check,
} from 'lucide-react';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR, formatLakh, ROLE_PROFILES, type UserRole } from '@arihant/shared';
import type { DashboardMetricsDto } from '@arihant/shared';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);
  const [closingTenders, setClosingTenders] = useState<any[]>([]);
  const [visitsList, setVisitsList] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [demosList, setDemosList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [
          metricsRes,
          closingTendersRes,
          visitsRes,
          leadsRes,
          demosRes,
          serviceRes,
          expensesRes,
          tasksRes,
        ] = await Promise.all([
          api.get<DashboardMetricsDto>('/dashboard/metrics').catch(() => null),
          api.get('/tenders', { closingSoonOnly: true, limit: 6 }).catch(() => ({ data: [] })),
          api.get('/visits', { limit: 6 }).catch(() => ({ data: [] })),
          api.get('/leads', { limit: 6 }).catch(() => ({ data: [] })),
          api.get('/demos', { limit: 6 }).catch(() => ({ data: [] })),
          api.get('/service', { limit: 6 }).catch(() => ({ data: [] })),
          api.get('/expenses', { limit: 8 }).catch(() => ({ data: [] })),
          api.get('/tasks', { limit: 6 }).catch(() => ({ data: [] })),
        ]);

        setMetrics(metricsRes);
        setClosingTenders(closingTendersRes?.data || []);
        setVisitsList(visitsRes?.data || []);
        setLeadsList(leadsRes?.data || []);
        setDemosList(demosRes?.data || []);
        setServiceList(serviceRes?.data || []);
        setExpensesList(expensesRes?.data || []);
        setTasksList(tasksRes?.data || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const role = user?.role || 'management';
  const roleProfile = ROLE_PROFILES[role];
  const roleInfo = user ? PRESET_ROLE_USERS[role] : null;

  const activePipelineValueLakh = leadsList.reduce(
    (acc, l) => acc + (Number(l.estimated_value_lakh) || Number(l.value_lakh) || 0),
    0,
  );
  const totalEmdAmount = closingTenders.reduce(
    (acc, t) => acc + (Number(t.emd_fee) || 0),
    0,
  );

  // Role-specific workbench header titles
  const getWorkbenchTitle = () => {
    switch (role) {
      case 'sales':
        return 'Sales Field Operations Desk';
      case 'tender_team':
        return 'GeM Defence Tender War Room';
      case 'demo_team':
        return 'Demo Operations & Depot Fleet Hub';
      case 'service_team':
        return 'Customer Support & Breakdown Service Desk';
      case 'accounts':
        return 'Corporate Finance & Expense Audit Desk';
      case 'regional_manager':
        return 'Regional Territory Operations Desk';
      case 'admin':
        return 'System Infrastructure & Administration Console';
      case 'management':
      default:
        return 'Command Executive Center';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── TOP HERO BANNER: PERSONA-SPECIFIC WORKBENCH ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#D6E3F5] p-6 lg:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAF2FF] border border-[#D6E3F5] text-[11px] font-bold text-[#223FA7] uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" />
              <span>
                {roleProfile?.department || 'Defence Operations'} · {roleInfo?.title || role.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-950 tracking-tight">
              {getWorkbenchTitle()}
            </h1>
            <p className="text-xs lg:text-sm text-[#5871A5] font-normal leading-relaxed">
              {roleProfile?.scopeSummary || 'Operational visibility across security tenders, field programs, and financial settlements.'}
            </p>
          </div>

          {/* Role-Specific Fast Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 max-w-full shrink-0">
            {role === 'sales' && (
              <>
                <Link href="/visits">
                  <Button size="md" variant="primary">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Plan Field Visit</span>
                  </Button>
                </Link>
                <Link href="/leads">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Target className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Leads Funnel</span>
                  </Button>
                </Link>
                <Link href="/demos">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Box className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Request Demo</span>
                  </Button>
                </Link>
                <Link href="/expenses">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Receipt className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Claim Expense</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'tender_team' && (
              <>
                <Link href="/tenders">
                  <Button size="md" variant="primary">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Browse Live Tenders</span>
                  </Button>
                </Link>
                <Link href="/proposals">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <FileText className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Commercial Quotes</span>
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <CheckSquare className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Action Milestones</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'demo_team' && (
              <>
                <Link href="/demos">
                  <Button size="md" variant="primary">
                    <Box className="mr-2 h-4 w-4" />
                    <span>Demo Fleet Matrix</span>
                  </Button>
                </Link>
                <Link href="/visits">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Calendar className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Client Field Trials</span>
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <CheckSquare className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Depot Tasks</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'service_team' && (
              <>
                <Link href="/service">
                  <Button size="md" variant="primary">
                    <Wrench className="mr-2 h-4 w-4" />
                    <span>Breakdown Tickets</span>
                  </Button>
                </Link>
                <Link href="/visits">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Calendar className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Service Field Visits</span>
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <CheckSquare className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Spare Parts Tasks</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'accounts' && (
              <>
                <Link href="/expenses">
                  <Button size="md" variant="primary">
                    <Receipt className="mr-2 h-4 w-4" />
                    <span>Audit Pending Claims</span>
                  </Button>
                </Link>
                <Link href="/tasks">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <CheckSquare className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Finance Tasks</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'regional_manager' && (
              <>
                <Link href="/regional">
                  <Button size="md" variant="primary">
                    <Compass className="mr-2 h-4 w-4" />
                    <span>Launch Regional Hub</span>
                  </Button>
                </Link>
                <Link href="/visits">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Calendar className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Tour Planner & Also Meet</span>
                  </Button>
                </Link>
                <Link href="/tenders">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <FileText className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Territory Tenders</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link href="/admin">
                  <Button size="md" variant="primary">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>RBAC & User Masters</span>
                  </Button>
                </Link>
                <Link href="/regional">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Compass className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Territory Hub</span>
                  </Button>
                </Link>
              </>
            )}

            {role === 'management' && (
              <>
                <Link href="/tenders">
                  <Button size="md" variant="primary">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Live Tenders</span>
                  </Button>
                </Link>
                <Link href="/regional">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Compass className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Regional Command</span>
                  </Button>
                </Link>
                <Link href="/visits">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Calendar className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Tour Planner</span>
                  </Button>
                </Link>
                <Link href="/expenses">
                  <Button size="md" variant="secondary" className="border-[#D6E3F5] text-[#223FA7]">
                    <Receipt className="mr-2 h-4 w-4 text-[#223FA7]" />
                    <span>Settle Claims</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ROLE-SPECIFIC 4 KPI HUD CARDS (3PX TOP ACCENT BAR) ── */}
      {/* 1. SALES HUD */}
      {role === 'sales' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/leads" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">My Active Pipeline</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><Target size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{formatLakh(activePipelineValueLakh)}</div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>Active Pipeline</span><span className="font-bold text-[#223FA7]">{leadsList.length} Leads</span>
              </div>
            </div>
          </Link>

          <Link href="/visits" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">My Planned Visits</span>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Calendar size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{visitsList.length} Visits</div>
              <div className="text-[11px] text-blue-600 font-medium pt-2 border-t border-blue-50 flex justify-between">
                <span>Field Tour Calendar</span><span className="font-bold">Active</span>
              </div>
            </div>
          </Link>

          <Link href="/demos" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Active Demo Trials</span>
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Box size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{demosList.length} In-Field</div>
              <div className="text-[11px] text-emerald-600 font-medium pt-2 border-t border-emerald-50 flex justify-between">
                <span>Client Trials</span><span className="font-bold">Hardware Reserved</span>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">My Milestone Tasks</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><CheckSquare size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{tasksList.length} Tasks</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>Action Milestones</span><span className="font-bold">0 Blocked</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 2. TENDER TEAM HUD */}
      {role === 'tender_team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/tenders" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-red-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Closing ≤ 7 Days</span>
                <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><Clock size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{metrics?.tendersCount.closingSoon ?? closingTenders.length} Urgent</div>
              <div className="text-[11px] text-red-600 font-medium pt-2 border-t border-red-50 flex justify-between">
                <span>Immediate Attention</span><span className="font-bold">Countdown Active</span>
              </div>
            </div>
          </Link>

          <Link href="/tenders" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Total Active Bids</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><FileText size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{metrics?.tendersCount.total ?? 0} Bids</div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>National GeM Cell</span><span className="font-bold text-[#223FA7]">All-India</span>
              </div>
            </div>
          </Link>

          <Link href="/proposals" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Awaiting Signoff</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><AlertTriangle size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{tasksList.length} Milestones</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>Go/No-Go Approval</span><span className="font-bold">Pending Review</span>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Locked EMD Guarantees</span>
                <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Shield size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{formatINR(totalEmdAmount)}</div>
              <div className="text-[11px] text-purple-700 font-medium pt-2 border-t border-purple-50 flex justify-between">
                <span>Bank Guarantees</span><span className="font-bold">Refund Tracking</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 3. DEMO TEAM HUD */}
      {role === 'demo_team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/demos" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Depot Fleet Hardware</span>
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Box size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">28 Units</div>
              <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-emerald-50 flex justify-between">
                <span>Delhi, Patna, Kolkata</span><span className="font-bold">Active Fleet</span>
              </div>
            </div>
          </Link>

          <Link href="/demos" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">In-Field / Reserved</span>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Truck size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">12 Units</div>
              <div className="text-[11px] text-blue-600 font-medium pt-2 border-t border-blue-50 flex justify-between">
                <span>Client Demonstrations</span><span className="font-bold">Dispatched</span>
              </div>
            </div>
          </Link>

          <Link href="/visits" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Scheduled Field Trials</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><Calendar size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{demosList.length} Trials</div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>Defence & Police</span><span className="font-bold text-[#223FA7]">This Month</span>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Pending Outcome Certs</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><CheckSquare size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">3 Pending</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>Post-Trial Clearance</span><span className="font-bold">Followup Required</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 4. SERVICE TEAM HUD */}
      {role === 'service_team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/service" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-red-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Open Breakdown Tickets</span>
                <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><Wrench size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{serviceList.length || 8} Incidents</div>
              <div className="text-[11px] text-red-600 font-medium pt-2 border-t border-red-50 flex justify-between">
                <span>Scanner & Detector Fleet</span><span className="font-bold">Triage Active</span>
              </div>
            </div>
          </Link>

          <Link href="/service" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Critical Emergency Calls</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><AlertTriangle size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">2 Urgent</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>SLA &lt; 24h Response</span><span className="font-bold">Airport / Checkpost</span>
              </div>
            </div>
          </Link>

          <Link href="/visits" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Field Visits Scheduled</span>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Calendar size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">4 Dispatches</div>
              <div className="text-[11px] text-blue-600 font-medium pt-2 border-t border-blue-50 flex justify-between">
                <span>Diagnostic Visits</span><span className="font-bold">This Week</span>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Spare Parts Blockers</span>
                <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><CheckSquare size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">2 Blocked</div>
              <div className="text-[11px] text-purple-700 font-medium pt-2 border-t border-purple-50 flex justify-between">
                <span>Awaiting Components</span><span className="font-bold">OEM Requisition</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 5. ACCOUNTS TEAM HUD */}
      {role === 'accounts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/expenses" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Pending Stage 2 Reimbursements</span>
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Receipt size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{formatINR(metrics?.expensesCount.pendingAmount ?? 845000)}</div>
              <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-emerald-50 flex justify-between">
                <span>Finance Verification Queue</span><span className="font-bold">Awaiting Payout</span>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Manager-Approved Claims</span>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><CheckCircle2 size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">
                {(metrics?.expensesCount.pendingManager ?? 0) + (metrics?.expensesCount.pendingAccounts ?? 0)} Claims
              </div>
              <div className="text-[11px] text-blue-600 font-medium pt-2 border-t border-blue-50 flex justify-between">
                <span>Stage 1 Endorsed</span><span className="font-bold">Ready for Signoff</span>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Tender EMD Guarantees</span>
                <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Shield size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{formatINR(totalEmdAmount)}</div>
              <div className="text-[11px] text-purple-700 font-medium pt-2 border-t border-purple-50 flex justify-between">
                <span>Bank Guarantees</span><span className="font-bold">Active Float</span>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Finance Tasks</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><CheckSquare size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{tasksList.length} Tasks</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>GST & Billing Milestones</span><span className="font-bold">In Progress</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 6. REGIONAL MANAGER HUD */}
      {role === 'regional_manager' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/regional" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">North Zone Pipeline</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><TrendingUp size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">
                {formatLakh(metrics?.leadsCount.totalValueLakh ?? activePipelineValueLakh)}
              </div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>Territory Quota</span><span className="font-bold text-[#223FA7]">{leadsList.length} Opportunities</span>
              </div>
            </div>
          </Link>

          <Link href="/tenders" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-red-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Territory GeM Bids</span>
                <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><FileText size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{metrics?.tendersCount.total ?? 0} Bids</div>
              <div className="text-[11px] text-red-600 font-medium pt-2 border-t border-red-50 flex justify-between">
                <span>North Zone Scrutiny</span><span className="font-bold">Closing Soon</span>
              </div>
            </div>
          </Link>

          <Link href="/visits" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Field Tour Completion</span>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Calendar size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">
                {visitsList.length > 0 ? `${Math.round((visitsList.filter((v: any) => v.status === 'completed').length / visitsList.length) * 100)}%` : '0%'} Rate
              </div>
              <div className="text-[11px] text-blue-600 font-medium pt-2 border-t border-blue-50 flex justify-between">
                <span>Also Meet Directives</span><span className="font-bold">Active Oversight</span>
              </div>
            </div>
          </Link>

          <Link href="/regional" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Territory Field Personnel</span>
                <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Users size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">8 Active Roles</div>
              <div className="text-[11px] text-purple-700 font-medium pt-2 border-t border-purple-50 flex justify-between">
                <span>Blueprint §4 Scorecard</span><span className="font-bold">0 Auto-Deductions</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 7. ADMIN HUD */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/admin" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Active User Accounts</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><Users size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">8 Active Users</div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>Personnel Directory</span><span className="font-bold text-[#223FA7]">8 Departments</span>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Enterprise RBAC Personas</span>
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Key size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">8 Roles</div>
              <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-emerald-50 flex justify-between">
                <span>Permissions Matrix</span><span className="font-bold">Consistent</span>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Equipment Masters</span>
                <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Box size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">MHA QR Fleet</div>
              <div className="text-[11px] text-purple-700 font-medium pt-2 border-t border-purple-50 flex justify-between">
                <span>MHA Qualitative Reqs</span><span className="font-bold">Master Table</span>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Security Audit Trail</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><Shield size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">Immutable Log</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>Immutable PostgreSQL</span><span className="font-bold">Audited</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 8. MANAGEMENT HUD (DEFAULT) */}
      {role === 'management' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link href="/tenders" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-red-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Tenders Closing ≤ 7d</span>
                <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><Clock size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{metrics?.tendersCount.closingSoon ?? closingTenders.length}</div>
              <div className="text-[11px] text-red-600 font-medium pt-2 border-t border-red-50 flex justify-between">
                <span>Critical Attention</span><span className="font-bold">{metrics?.tendersCount.total ?? 0} Bids</span>
              </div>
            </div>
          </Link>

          <Link href="/leads" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-[#223FA7]/40 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Active Leads Pipeline</span>
                <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center"><Target size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">
                {formatLakh(metrics?.leadsCount.totalValueLakh ?? activePipelineValueLakh)}
              </div>
              <div className="text-[11px] text-[#5871A5] pt-2 border-t border-gray-100 flex justify-between">
                <span>Expected Pipeline</span><span className="font-bold text-[#223FA7]">{metrics?.leadsCount.total ?? leadsList.length} Accounts</span>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Pending Reimbursements</span>
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Receipt size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{formatINR(metrics?.expensesCount.pendingAmount ?? 0)}</div>
              <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-emerald-50 flex justify-between">
                <span>Under Signoff</span><span className="font-bold">{(metrics?.expensesCount.pendingManager ?? 0) + (metrics?.expensesCount.pendingAccounts ?? 0)} Claims</span>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="block">
            <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 transition-all hover:shadow-md hover:border-amber-300 flex flex-col justify-between h-full min-h-[115px]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">Milestone Tasks</span>
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><CheckSquare size={14} /></div>
              </div>
              <div className="text-2xl font-black text-gray-950 mb-1">{metrics?.tasksCount.pending ?? tasksList.length} In Progress</div>
              <div className="text-[11px] text-amber-700 font-medium pt-2 border-t border-amber-50 flex justify-between">
                <span>Company Milestones</span><span className="font-bold text-red-600">{metrics?.tasksCount.blocked ?? 0} Blocked</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── WORKBENCH MAIN CONTENT AREA: PERSONA-TAILORED TABLES & WIDGETS ── */}

      {/* SALES WORKBENCH CONTENT */}
      {role === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget 1: My Scheduled Client Visits */}
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#223FA7]" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                  My Scheduled Client Visits & Tour Plan
                </h3>
              </div>
              <Link href="/visits" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                <span>View All</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#D6E3F5]">
              {visitsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  No client visits currently scheduled. Plan a visit to populate this list.
                </div>
              ) : (
                visitsList.map((v) => (
                  <div key={v.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{v.organisation_name || 'Client Organisation'}</div>
                      <div className="text-[11px] text-[#5871A5] mt-0.5">{v.purpose || 'Official Liaison & Demonstration Discussion'}</div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2 font-mono">
                        <span>Planned: {v.planned_date ? new Date(v.planned_date).toLocaleDateString('en-IN') : 'Scheduled'}</span>
                        {v.city && <span>· {v.city}</span>}
                      </div>
                    </div>
                    <Badge variant={v.status === 'completed' ? 'success' : 'cyber'} size="sm" className="uppercase shrink-0">
                      {v.status || 'PLANNED'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 2: My Active Leads & Deal Pipeline */}
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#223FA7]" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                  My Active Leads & Prospect Pipeline
                </h3>
              </div>
              <Link href="/leads" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                <span>View Funnel</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#D6E3F5]">
              {leadsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  No active opportunities in pipeline. Create a new lead to begin tracking.
                </div>
              ) : (
                leadsList.map((l) => (
                  <div key={l.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{l.organisation_name || 'Prospect Client'}</div>
                      <div className="text-[11px] text-[#5871A5] mt-0.5">{l.product_name || 'Security Hardware'}</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">
                        Est. Value: <strong className="text-gray-900 font-bold">₹{l.estimated_value_lakh ?? 0} Lakh</strong>
                      </div>
                    </div>
                    <Badge variant="outline" size="sm" className="uppercase shrink-0 font-bold">
                      {l.stage || 'QUALIFIED'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TENDER TEAM WORKBENCH CONTENT */}
      {role === 'tender_team' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-red-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-red-950 uppercase tracking-wider">
                  Urgent Tender Closing Countdown Board (≤ 7 Days)
                </h3>
              </div>
              <Link href="/tenders" className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1">
                <span>All {closingTenders.length} Bids</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-red-100">
              {closingTenders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  No tenders closing within 7 days. All tender deadlines are on track.
                </div>
              ) : (
                closingTenders.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-red-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-700">{t.tender_no}</span>
                        <Badge variant="urgent" size="sm">CLOSING SOON</Badge>
                      </div>
                      <div className="text-xs font-semibold text-gray-900">{t.department || 'Defence / Security Procurement'}</div>
                      <div className="text-[11px] text-[#5871A5]">Requirement: {t.title || 'Multi-zone Security Scanners'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-red-600">
                        EMD: {t.emd_fee ? `₹${Number(t.emd_fee).toLocaleString('en-IN')}` : 'Exempted'}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Status: {t.status?.replace('_', ' ').toUpperCase()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEMO TEAM WORKBENCH CONTENT */}
      {role === 'demo_team' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#223FA7]" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Scheduled Client Demonstrations</h3>
              </div>
              <Link href="/demos" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                <span>View Fleet</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#D6E3F5]">
              {demosList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  No client equipment demonstrations currently scheduled.
                </div>
              ) : (
                demosList.map((d) => (
                  <div key={d.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{d.organisation_name || 'Client Unit'}</div>
                      <div className="text-[11px] text-[#5871A5] mt-0.5">Model: {d.product_name || 'Thermal Imaging Camera'}</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">Location: {d.depot_location || 'North Depot (Delhi)'}</div>
                    </div>
                    <Badge variant="cyber" size="sm" className="uppercase shrink-0">{d.status || 'CONFIRMED'}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E3F5] bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#223FA7]" />
              <span>Depot Equipment Availability Matrix</span>
            </h3>
            <div className="space-y-3">
              {[
                { depot: 'North Depot (Delhi)', total: demosList.filter((d) => (d.depot_location || d.location || '').includes('Delhi')).length },
                { depot: 'East Depot (Kolkata)', total: demosList.filter((d) => (d.depot_location || d.location || '').includes('Kolkata')).length },
                { depot: 'Central Depot (Patna)', total: demosList.filter((d) => (d.depot_location || d.location || '').includes('Patna')).length },
              ].map((m) => (
                <div key={m.depot} className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{m.depot}</span>
                    <div className="text-[11px] text-[#5871A5] mt-0.5">Active Hardware Units: {m.total}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{m.total} Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SERVICE TEAM WORKBENCH CONTENT */}
      {role === 'service_team' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#223FA7]" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Breakdown Incident Tickets</h3>
              </div>
              <Link href="/service" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                <span>View All Tickets</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#D6E3F5]">
              {serviceList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  All breakdown tickets cleared. No active breakdown calls logged.
                </div>
              ) : (
                serviceList.map((s) => (
                  <div key={s.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{s.organisation_name || 'Defence Depot'}</div>
                      <div className="text-[11px] text-[#5871A5] mt-0.5">{s.issue_description || 'Optical Sensor Calibration Fault'}</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">
                        {s.ticket_no ? `Ticket Ref: #${s.ticket_no}` : (s.product_name || 'Service Breakdown Call')}
                      </div>
                    </div>
                    <Badge variant={s.priority === 'critical' ? 'urgent' : 'warning'} size="sm" className="uppercase shrink-0">
                      {s.priority || 'MEDIUM'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E3F5] bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#223FA7]" />
              <span>Installed Machine Fleet Coverage</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-emerald-950">Active Resolved Tickets</div>
                  <div className="text-[11px] text-emerald-700">Repairs completed with sign-off documentation</div>
                </div>
                <span className="font-bold text-lg text-emerald-800">
                  {serviceList.filter((s) => s.status === 'completed' || s.status === 'closed').length} Units
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-blue-950">Active Open Breakdowns</div>
                  <div className="text-[11px] text-blue-700">Immediate diagnostic and spare parts deployment</div>
                </div>
                <span className="font-bold text-lg text-blue-800">
                  {serviceList.filter((s) => s.status !== 'completed' && s.status !== 'closed').length} Units
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNTS TEAM WORKBENCH CONTENT */}
      {role === 'accounts' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#223FA7]" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                  Two-Stage Reimbursement Audit Queue (Ready for Payout)
                </h3>
              </div>
              <Link href="/expenses" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                <span>All Claims</span><ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#D6E3F5]">
              {expensesList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5871A5]">
                  No reimbursement claims awaiting audit signoff.
                </div>
              ) : (
                expensesList.map((e) => (
                  <div key={e.id} className="p-4 hover:bg-[#F7FBFF] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{e.claimant_name || 'Field Representative'}</div>
                      <div className="text-[11px] text-[#5871A5] mt-0.5">{e.description || 'Inter-city client tour travel and lodging'}</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">Category: {e.category?.toUpperCase() || 'TRAVEL'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-700 text-sm">{formatINR(e.amount || 0)}</div>
                      <Badge variant="success" size="sm" className="mt-1">MANAGER ENDORSED</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGIONAL MANAGER WORKBENCH CONTENT */}
      {role === 'regional_manager' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#223FA7]/30 bg-gradient-to-r from-[#223FA7]/5 via-white to-blue-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#223FA7] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-950">Regional Territory Command Hub (North Zone)</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF2FF] text-[#223FA7] border border-[#D6E3F5]">
                    Territory Operations
                  </span>
                </div>
                <p className="text-xs text-[#5871A5] mt-0.5">
                  Access territory-scoped live sales funnel, field tour planner with &ldquo;Also Meet&rdquo; directives, and Blueprint §4 employee performance evidence dossier.
                </p>
              </div>
            </div>
            <Link href="/regional" className="shrink-0">
              <Button size="sm" variant="primary">
                <span>Open Territory Hub</span>
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ADMIN WORKBENCH CONTENT */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#D6E3F5] bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-[#223FA7]" />
              <span>8-Persona Role Governance Status</span>
            </h3>
            <p className="text-xs text-[#5871A5]">
              All 8 enterprise personas are configured with operational and territorial consistency. Final permissions will be configured during implementation.
            </p>
            <Link href="/admin">
              <Button size="sm" variant="primary" className="w-full">
                <span>Open Permissions Matrix &amp; User Directory</span>
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* MANAGEMENT WORKBENCH CONTENT (LIVE TICKER & ALL-INDIA OVERVIEW) */}
      {role === 'management' && (
        <>
          {/* Live Scrolling Ticker */}
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs relative">
            <div className="flex items-center">
              <div className="z-10 bg-[#EAF2FF] border-r border-[#D6E3F5] px-3.5 py-2 flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#223FA7] whitespace-nowrap">
                  Live Feed
                </span>
              </div>
              <div className="overflow-hidden flex-1 py-2">
                <div className="animate-marquee items-center gap-8 text-xs font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Closing ≤ 7 Days:</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold border border-red-200">
                      {metrics?.tendersCount.closingSoon ?? closingTenders.length} Urgent Bids
                    </span>
                  </div>
                  <span className="text-gray-300">·</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Total Active Pipeline:</span>
                    <span className="font-mono font-bold text-[#223FA7]">
                      {formatLakh(metrics?.leadsCount.totalValueLakh ?? activePipelineValueLakh)}
                    </span>
                  </div>
                  <span className="text-gray-300">·</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Pending Reimbursements:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatINR(metrics?.expensesCount.pendingAmount ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#223FA7]" />
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                    Live GeM Tenders Closing Soon
                  </h3>
                </div>
                <Link href="/tenders" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                  <span>View All ({closingTenders.length})</span><ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-[#D6E3F5]">
                {closingTenders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5871A5]">
                    No tenders currently closing within 7 days.
                  </div>
                ) : (
                  closingTenders.map((t) => (
                    <div key={t.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-red-700">{t.tender_no}</span>
                        <div className="text-xs font-semibold text-gray-900 mt-0.5">{t.department || 'Defence Procurement'}</div>
                      </div>
                      <Badge variant="urgent" size="sm">URGENT</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#223FA7]" />
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                    Company Action Milestones &amp; Blockers
                  </h3>
                </div>
                <Link href="/tasks" className="text-xs font-bold text-[#223FA7] hover:underline flex items-center gap-1">
                  <span>View All ({tasksList.length})</span><ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-[#D6E3F5]">
                {tasksList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5871A5]">
                    No action milestones or blockers recorded.
                  </div>
                ) : (
                  tasksList.map((tk) => (
                    <div key={tk.id} className="p-3.5 hover:bg-[#F7FBFF] transition-colors flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-gray-900">{tk.title || 'Action Milestone'}</div>
                        <div className="text-[11px] text-[#5871A5] mt-0.5">Assigned: {tk.assigned_to_name || 'Team Member'}</div>
                      </div>
                      <Badge variant={tk.is_blocked ? 'danger' : 'cyber'} size="sm">
                        {tk.is_blocked ? 'BLOCKED' : 'IN PROGRESS'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
