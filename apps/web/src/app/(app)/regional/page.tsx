'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Target,
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Building,
  UserCheck,
  ChevronRight,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Send,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatLakh, formatINR } from '@arihant/shared';

export default function RegionalPage() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionInstructions, setInterventionInstructions] = useState('');
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRegionalData = async (zoneId?: string) => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (zoneId) {
        params.zone_id = zoneId;
      }
      const res = await api.get('/dashboard/regional-performance', params);
      setData(res);
      if (res.zone && !selectedZoneId) {
        setSelectedZoneId(res.zone.id);
      }
    } catch (err) {
      console.error('Failed to load regional performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole(['regional_manager', 'management', 'admin'])) {
      fetchRegionalData(selectedZoneId || undefined);
    }
  }, [selectedZoneId]);

  const handleOpenIntervention = (visit: any) => {
    setSelectedVisit(visit);
    setInterventionInstructions('');
    setActionError(null);
    setIsInterventionModalOpen(true);
  };

  const handleSaveIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setIsSubmittingIntervention(true);
    setActionError(null);

    try {
      await api.post(`/visits/${selectedVisit.id}/intervention`, {
        instructions: interventionInstructions,
      });
      setIsInterventionModalOpen(false);
      await fetchRegionalData(selectedZoneId || undefined);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit manager intervention.');
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  if (!hasRole(['regional_manager', 'management', 'admin'])) {
    return (
      <div className="p-12 text-center text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl space-y-3 shadow-xs">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#1A1A1A]">Access Restricted</h2>
        <p className="text-xs">
          Only Regional Managers, Executive Management, and System Administrators have permission to access the Regional Command Hub.
        </p>
      </div>
    );
  }

  const zoneName = data?.zone?.name || 'North';
  const zoneCode = data?.zone?.code || 'N';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── TOP HERO BANNER (CoachAssist Modern Header) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#D6E3F5] p-6 lg:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAF2FF] border border-[#D6E3F5] text-[11px] font-bold text-[#223FA7] uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>{zoneName.toUpperCase()} ZONE COMMAND &bull; CODE {zoneCode}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2.5">
              <span>Regional Territory Performance Hub</span>
            </h1>
            <p className="text-xs lg:text-sm text-[#5871A5] font-normal max-w-2xl leading-relaxed">
              Consolidated command of sales leads, field tour execution, live GeM defense tenders, and employee accountability across {zoneName} Zone.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Zone Switcher for Management / Admin */}
            {hasRole(['management', 'admin']) && data?.availableZones && (
              <div className="flex items-center space-x-2 bg-[#F7FBFF] border border-[#D6E3F5] px-3 py-1.5 rounded-lg text-xs">
                <span className="text-[10px] font-bold uppercase text-[#5871A5]">Territory:</span>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="bg-transparent font-bold text-[#223FA7] focus:outline-none cursor-pointer"
                >
                  {data.availableZones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.name} Zone ({z.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link href="/visits">
              <Button variant="secondary" size="md" className="shadow-xs">
                <Calendar className="mr-2 h-4 w-4 text-[#223FA7]" />
                <span>Tour Planner</span>
              </Button>
            </Link>

            <Link href="/tasks">
              <Button variant="primary" size="md" className="shadow-xs">
                <Plus className="mr-2 h-4 w-4" />
                <span>Assign Task</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 KEY ACCENT METRIC HUD CARDS (3px Top Border) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Regional Sales Pipeline */}
        <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 text-left transition-all duration-200 hover:shadow-md hover:border-[#3770E3] flex flex-col justify-between min-h-[115px]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#223FA7]" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">
                Regional Pipeline
              </span>
              <div className="w-7 h-7 bg-[#EAF2FF] text-[#223FA7] rounded-lg flex items-center justify-center shrink-0 border border-[#D6E3F5]">
                <Target size={14} />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight leading-none mb-1">
              {formatLakh(data?.sales?.totalPipelineValueLakh ?? 0)}
            </div>
          </div>
          <div className="text-[11px] font-medium mt-2 pt-2 border-t border-[#F0F5FC] text-[#5871A5] flex items-center justify-between">
            <span>{data?.sales?.totalLeads ?? 0} Opportunities</span>
            <span className="text-[#223FA7] font-semibold">{data?.sales?.activeCount ?? 0} Active</span>
          </div>
        </div>

        {/* Card 2: GeM Tenders in Zone */}
        <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 text-left transition-all duration-200 hover:shadow-md hover:border-red-300 flex flex-col justify-between min-h-[115px]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">
                Territory GeM Bids
              </span>
              <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0 border border-red-100">
                <FileText size={14} />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight leading-none mb-1">
              {data?.tenders?.total ?? 0} Bids
            </div>
          </div>
          <div className="text-[11px] font-medium mt-2 pt-2 border-t border-red-50 text-red-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              {data?.tenders?.closingSoon ?? 0} Closing &le; 7 Days
            </span>
            <span className="font-bold">{data?.tenders?.awaitingApproval ?? 0} Signoff</span>
          </div>
        </div>

        {/* Card 3: Field Tours & Client Visits */}
        <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 text-left transition-all duration-200 hover:shadow-md hover:border-emerald-300 flex flex-col justify-between min-h-[115px]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">
                Field Client Visits
              </span>
              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                <Calendar size={14} />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight leading-none mb-1">
              {data?.visits?.completed ?? 0} / {data?.visits?.total ?? 0}
            </div>
          </div>
          <div className="text-[11px] font-medium mt-2 pt-2 border-t border-emerald-50 text-emerald-700 flex items-center justify-between">
            <span>{data?.visits?.completionRate ?? 0}% Delivery Rate</span>
            <span>{data?.visits?.planned ?? 0} Upcoming</span>
          </div>
        </div>

        {/* Card 4: Team Headcount & Compliance */}
        <div className="bg-white border border-[#D6E3F5] rounded-xl overflow-hidden relative pt-4 pb-3.5 px-4 text-left transition-all duration-200 hover:shadow-md hover:border-amber-300 flex flex-col justify-between min-h-[115px]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#5871A5] font-bold uppercase tracking-wider">
                Territory Personnel
              </span>
              <div className="w-7 h-7 bg-amber-50 text-amber-800 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
                <Users size={14} />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight leading-none mb-1">
              {data?.teamPerformance?.length ?? 0} Reps
            </div>
          </div>
          <div className="text-[11px] font-medium mt-2 pt-2 border-t border-amber-50 text-amber-800 flex items-center justify-between">
            <span>
              {data?.teamPerformance?.filter((e: any) => e.complianceRating === 'Excellent' || e.complianceRating === 'Good').length ?? 0} In Good Standing
            </span>
            <span className="text-[10px] text-[#5871A5]">Policy §4 Active</span>
          </div>
        </div>
      </div>

      {/* ── 4 TABS NAVIGATION ── */}
      <Tabs
        tabs={[
          { id: 'team', label: `Team Accountability (${data?.teamPerformance?.length || 0})` },
          { id: 'leads', label: `Sales Leads & Funnel (${data?.sales?.totalLeads || 0})` },
          { id: 'visits', label: `Territory Tours & Visits (${data?.visits?.total || 0})` },
          { id: 'tenders', label: `Territory GeM Tenders (${data?.tenders?.total || 0})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── TAB 1: EMPLOYEE ACCOUNTABILITY & PERFORMANCE ── */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-[#223FA7]" />
              <span className="text-xs font-bold text-[#1A1A1A]">
                Direct Reports & Regional Staff Scorecard
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Filter rep by name, territory, email..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#D6E3F5] text-xs text-[#1A1A1A] placeholder:text-[#5871A5] focus:outline-none focus:border-[#3770E3] w-64 shadow-xs"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
                  <tr>
                    <th className="p-3.5">Representative</th>
                    <th className="p-3.5">Role & Region</th>
                    <th className="p-3.5 text-center">Milestones (Done/Total)</th>
                    <th className="p-3.5 text-center">Overdue</th>
                    <th className="p-3.5 text-center">Visits Done</th>
                    <th className="p-3.5 text-right">Pipeline (₹ L)</th>
                    <th className="p-3.5 text-center">Active Blockers</th>
                    <th className="p-3.5 text-center">Compliance</th>
                    <th className="p-3.5 text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E3F5]">
                  {data?.teamPerformance
                    ?.filter(
                      (emp: any) =>
                        !searchEmployee ||
                        emp.full_name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                        emp.email.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                        emp.region_name.toLowerCase().includes(searchEmployee.toLowerCase()),
                    )
                    .map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-[#F7FBFF] transition-colors">
                        <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                          {emp.full_name}
                          <div className="text-[10px] text-[#5871A5] font-mono font-normal">
                            {emp.email}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-800 capitalize">
                            {emp.role.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-[#5871A5]">
                            {emp.region_name}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono whitespace-nowrap">
                          <span className="font-bold text-[#1A1A1A]">
                            {emp.tasks.completed}/{emp.tasks.total}
                          </span>
                          <span className="text-[10px] text-[#5871A5] ml-1">
                            ({emp.tasks.completionRate}%)
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {emp.tasks.overdue > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                              {emp.tasks.overdue} OVERDUE
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium">0</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-gray-800 whitespace-nowrap">
                          {emp.visits.completed} / {emp.visits.total}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-[#223FA7] whitespace-nowrap">
                          {formatLakh(emp.leads.valueLakh || 0)}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {emp.activeBlockers.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                              {emp.activeBlockers.length} BLOCKED
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#5871A5]">None</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <Badge
                            variant={
                              emp.complianceRating === 'Excellent'
                                ? 'success'
                                : emp.complianceRating === 'Good'
                                ? 'default'
                                : emp.complianceRating === 'Needs Attention'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {emp.complianceRating.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsEvidenceModalOpen(true);
                            }}
                            className="shadow-xs text-xs text-[#223FA7]"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-[11px] text-[#5871A5] flex items-center justify-between">
            <span>
              <strong>Blueprint §4 Policy Enforced:</strong> The BOS never auto-deducts salaries. It surfaces empirical evidence (task completion, deadline compliance, blocker resolution) for management decision-making.
            </span>
            <span className="text-[#223FA7] font-semibold font-mono">NORTH-ZONE-AUDIT-READY</span>
          </div>
        </div>
      )}

      {/* ── TAB 2: REGIONAL LEADS & SALES FUNNEL ── */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] shadow-xs">
              <span className="text-[10px] text-[#5871A5] font-bold uppercase block">
                High Probability Value
              </span>
              <span className="text-xl font-extrabold text-emerald-700">
                {formatLakh(data?.sales?.highProbValueLakh || 0)}
              </span>
              <span className="text-[11px] text-[#5871A5] block mt-1">Confirmed Procurement Stage</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] shadow-xs">
              <span className="text-[10px] text-[#5871A5] font-bold uppercase block">
                Medium Probability Value
              </span>
              <span className="text-xl font-extrabold text-[#223FA7]">
                {formatLakh(data?.sales?.medProbValueLakh || 0)}
              </span>
              <span className="text-[11px] text-[#5871A5] block mt-1">Technical Spec / QR Stage</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] shadow-xs">
              <span className="text-[10px] text-[#5871A5] font-bold uppercase block">
                Expected / Follow-Up Pipeline
              </span>
              <span className="text-xl font-extrabold text-amber-700">
                {formatLakh(data?.sales?.lowProbValueLakh || 0)}
              </span>
              <span className="text-[11px] text-[#5871A5] block mt-1">Initial Engagement & Calls</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A]">
                Regional Leads Register ({data?.sales?.recentLeads?.length || 0})
              </span>
              <Link href="/leads">
                <Button size="sm" variant="outline" className="text-xs text-[#223FA7]">
                  View All in CRM <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
                  <tr>
                    <th className="p-3.5">Organisation & City</th>
                    <th className="p-3.5">Product Category</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Probability</th>
                    <th className="p-3.5 text-right">Value (₹ Lakh)</th>
                    <th className="p-3.5">Territory Rep</th>
                    <th className="p-3.5">Follow-Up Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E3F5]">
                  {data?.sales?.recentLeads?.map((ld: any) => (
                    <tr key={ld.id} className="hover:bg-[#F7FBFF] transition-colors">
                      <td className="p-3.5 font-bold text-[#1A1A1A]">
                        {ld.organisation_name}
                        <div className="text-[10px] text-[#5871A5] font-normal">{ld.city || 'North Zone'}</div>
                      </td>
                      <td className="p-3.5 text-gray-800">{ld.product_name || 'Security Scanning Hardware'}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" size="sm" className="uppercase font-bold">
                          {ld.category}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={ld.probability === 'high' ? 'success' : ld.probability === 'medium' ? 'default' : 'warning'}
                          size="sm"
                          className="uppercase font-bold"
                        >
                          {ld.probability}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#223FA7]">
                        {formatLakh(ld.value_lakh || 0)}
                      </td>
                      <td className="p-3.5 text-gray-700">{ld.assigned_rep_name || 'Territory Rep'}</td>
                      <td className="p-3.5 font-mono text-gray-700">
                        {ld.next_followup_date ? new Date(ld.next_followup_date).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FIELD VISITS & TOUR PLANNING ── */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1A1A1A]">
                  Scheduled Client Tours & Interventions
                </span>
                <p className="text-[11px] text-[#5871A5]">
                  Regional Managers can attach &quot;Also Meet&quot; stops or directive instructions onto active salesperson trip itineraries.
                </p>
              </div>
              <Link href="/visits">
                <Button size="sm" variant="outline" className="text-xs text-[#223FA7]">
                  Full Tour Planner <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
                  <tr>
                    <th className="p-3.5">Planned Date</th>
                    <th className="p-3.5">Organisation & Location</th>
                    <th className="p-3.5">Purpose</th>
                    <th className="p-3.5">Field Rep</th>
                    <th className="p-3.5">Tour Status</th>
                    <th className="p-3.5">Manager Directive</th>
                    <th className="p-3.5 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E3F5]">
                  {data?.visits?.recentVisits?.map((v: any) => (
                    <tr key={v.id} className="hover:bg-[#F7FBFF] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#1A1A1A] whitespace-nowrap">
                        {new Date(v.planned_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3.5 font-bold text-[#1A1A1A]">
                        {v.organisation_name}
                        <div className="text-[10px] text-[#5871A5] font-normal flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#223FA7]" />
                          <span>{v.location || 'Client HQ'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-800 max-w-[200px] truncate">{v.purpose || 'Technical brief'}</td>
                      <td className="p-3.5 text-gray-700 whitespace-nowrap">{v.assigned_rep_name || 'Territory Rep'}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant={v.status === 'completed' ? 'success' : v.status === 'planned' ? 'default' : 'warning'}
                          size="sm"
                          className="uppercase font-bold"
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-gray-600 max-w-[180px] truncate font-italic">
                        {v.remarks ? (
                          <span className="text-purple-800 font-medium">{v.remarks}</span>
                        ) : (
                          <span className="text-gray-400">None attached</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenIntervention(v)}
                          className="text-xs text-[#223FA7] hover:bg-[#EAF2FF]"
                        >
                          + Add Stop / Also Meet
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TERRITORY GeM TENDERS ── */}
      {activeTab === 'tenders' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D6E3F5] bg-[#F7FBFF] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1A1A1A]">
                  GeM Defense & Security Tenders in {zoneName} Zone ({data?.tenders?.total || 0})
                </span>
                <p className="text-[11px] text-[#5871A5]">
                  Tender cell procurement opportunities tagged to defence bases, police HQs, and public security in your territory.
                </p>
              </div>
              <Link href="/tenders">
                <Button size="sm" variant="outline" className="text-xs text-[#223FA7]">
                  All GeM Bids <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
                  <tr>
                    <th className="p-3.5">Tender Reference No.</th>
                    <th className="p-3.5">Department / Buyer</th>
                    <th className="p-3.5">Requirement Details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Bid Closing Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E3F5]">
                  {data?.tenders?.regionalTendersList?.map((t: any) => {
                    const closing = t.bid_closing_date ? new Date(t.bid_closing_date) : null;
                    const diffDays = closing
                      ? Math.ceil((closing.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <tr key={t.id} className="hover:bg-[#F7FBFF] transition-colors">
                        <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                          <span className="font-mono text-[#223FA7]">{t.tender_no}</span>
                        </td>
                        <td className="p-3.5 text-gray-800">
                          <div className="font-semibold text-gray-900">{t.department || 'Government Buyer'}</div>
                          <div className="text-[10px] text-[#5871A5]">{t.city}, {t.state}</div>
                        </td>
                        <td className="p-3.5 text-gray-700 max-w-[240px] truncate">{t.requirement_text}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <Badge variant="outline" size="sm" className="uppercase font-bold">
                            {t.category}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono whitespace-nowrap">
                          {closing ? closing.toLocaleDateString('en-IN') : '-'}
                          {diffDays <= 7 && diffDays >= 0 && (
                            <div className="text-[10px] font-bold text-red-600">
                              {diffDays === 0 ? 'CLOSING TODAY' : `${diffDays} DAYS LEFT`}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <Badge
                            variant={
                              t.status === 'won'
                                ? 'success'
                                : t.status === 'awaiting_approval'
                                ? 'warning'
                                : t.status === 'under_preparation'
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="uppercase font-bold"
                          >
                            {t.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Link href={`/tenders?highlight=${t.id}`}>
                            <Button size="sm" variant="secondary" className="shadow-xs text-xs">
                              Inspect <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EMPLOYEE EVIDENCE & BLOCKER INSPECTION ── */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={selectedEmployee ? `${selectedEmployee.full_name} — Accountability Dossier` : 'Employee Evidence'}
        description="Delivery compliance, deadline performance, and active blockers for management review."
        maxWidth="lg"
      >
        {selectedEmployee && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#1A1A1A] block">{selectedEmployee.full_name}</span>
                <span className="text-[11px] text-[#5871A5] font-mono">{selectedEmployee.email} &bull; {selectedEmployee.role}</span>
              </div>
              <Badge
                variant={
                  selectedEmployee.complianceRating === 'Excellent'
                    ? 'success'
                    : selectedEmployee.complianceRating === 'Good'
                    ? 'default'
                    : selectedEmployee.complianceRating === 'Needs Attention'
                    ? 'warning'
                    : 'danger'
                }
                size="md"
              >
                {selectedEmployee.complianceRating.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-white border border-[#D6E3F5] text-center">
                <span className="text-[10px] text-[#5871A5] uppercase font-bold block">Tasks Done</span>
                <span className="text-base font-extrabold text-[#1A1A1A]">
                  {selectedEmployee.tasks.completed}/{selectedEmployee.tasks.total}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6E3F5] text-center">
                <span className="text-[10px] text-[#5871A5] uppercase font-bold block">Overdue</span>
                <span className="text-base font-extrabold text-red-600">{selectedEmployee.tasks.overdue}</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6E3F5] text-center">
                <span className="text-[10px] text-[#5871A5] uppercase font-bold block">Visits Completed</span>
                <span className="text-base font-extrabold text-emerald-700">{selectedEmployee.visits.completed}</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6E3F5] text-center">
                <span className="text-[10px] text-[#5871A5] uppercase font-bold block">Pipeline (₹ L)</span>
                <span className="text-base font-extrabold text-[#223FA7]">{formatLakh(selectedEmployee.leads.valueLakh || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#1A1A1A] block">Active Blockers & Escalations</span>
              {selectedEmployee.activeBlockers.length === 0 ? (
                <div className="p-3 text-center text-[#5871A5] bg-[#F7FBFF] rounded-lg border border-[#D6E3F5]">
                  No active blockers currently logged for this employee.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedEmployee.activeBlockers.map((b: any) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                      <div className="font-bold flex items-center justify-between">
                        <span>{b.task_title || 'Assigned Task'}</span>
                        <Badge variant="warning" size="sm">{b.blocker_type}</Badge>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1">{b.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
              <strong>Evidence Summary:</strong> {selectedEmployee.evidenceNote}
              <div className="mt-1 text-[10px] text-gray-500">
                Notice: In accordance with corporate governance rules, performance evaluations and compensation adjustments remain the sole prerogative of Executive Management.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsEvidenceModalOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: MANAGER INTERVENTION ("ALSO MEET / ADD STOP") ── */}
      <Modal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        title="Regional Manager Trip Intervention"
        description="Attach an imperative stop or stakeholder meeting to the salesperson's field visit itinerary."
        maxWidth="md"
      >
        <form onSubmit={handleSaveIntervention} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          {selectedVisit && (
            <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] space-y-1">
              <div className="font-bold text-[#1A1A1A]">{selectedVisit.organisation_name}</div>
              <div className="text-[11px] text-[#5871A5]">
                Planned Date: {new Date(selectedVisit.planned_date).toLocaleDateString('en-IN')} &bull; Rep: {selectedVisit.assigned_rep_name}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
              Manager Directive Instructions (e.g. &quot;Also meet Col. Bhatia in Procurement&quot;)
            </label>
            <textarea
              required
              rows={3}
              value={interventionInstructions}
              onChange={(e) => setInterventionInstructions(e.target.value)}
              placeholder="Specify the person to meet, additional enquiry, or critical quotation discussion..."
              className="w-full rounded-lg border border-[#D6E3F5] bg-white p-2.5 text-xs text-[#1A1A1A] focus:border-[#3770E3] focus:outline-none shadow-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsInterventionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmittingIntervention}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              <span>Dispatch Intervention Directive</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
