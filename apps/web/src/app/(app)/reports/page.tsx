'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Target,
  FileText,
  Calendar,
  Receipt,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
  PageContainer,
  PageHeader,
  StatGrid,
  StatCard,
} from '@/components/ui';
import { formatLakh, formatINR } from '@arihant/shared';

export default function ConsolidatedReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tenders');
  const [isLoading, setIsLoading] = useState(true);

  // Data sets
  const [tenders, setTenders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllReportData = async () => {
      try {
        setIsLoading(true);
        const [tendersRes, leadsRes, visitsRes, expensesRes, serviceRes] = await Promise.all([
          api.get('/tenders', { limit: 100 }).catch(() => ({ data: [] })),
          api.get('/leads', { limit: 100 }).catch(() => ({ data: [] })),
          api.get('/visits', { limit: 100 }).catch(() => ({ data: [] })),
          api.get('/expenses', { limit: 100 }).catch(() => ({ data: [] })),
          api.get('/service/tickets', { limit: 100 }).catch(() => ({ data: [] })),
        ]);

        setTenders(tendersRes?.data || []);
        setLeads(leadsRes?.data || []);
        setVisits(visitsRes?.data || []);
        setExpenses(expensesRes?.data || []);
        setTickets(serviceRes?.data || []);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllReportData();
  }, []);

  // Generic CSV Exporter
  const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const val = row[header];
            if (val === null || val === undefined) return '""';
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTenders = () => {
    const exportData = tenders.map((t) => ({
      'Tender No': t.tender_no,
      'Organisation': t.organisation_name || t.department || 'N/A',
      'Category': t.category?.toUpperCase() || 'GENERAL',
      'Quantity': t.quantity || 0,
      'EMD Fee (INR)': t.emd_fee || 0,
      'Bid Closing': t.bid_closing_date || 'N/A',
      'Status': t.status?.toUpperCase() || 'IDENTIFIED',
      'Zone': t.zone_name || t.zone_code || 'N/A',
      'City': t.city || 'N/A',
    }));
    exportToCsv('Arihant_GeM_Tenders_Report', exportData);
  };

  const handleExportLeads = () => {
    const exportData = leads.map((l) => ({
      'Organisation': l.organisation_name || 'N/A',
      'Product': l.product_name || 'N/A',
      'Category': l.category?.toUpperCase() || 'FOLLOW_UP',
      'Probability': l.probability?.toUpperCase() || 'MEDIUM',
      'Deal Value (Lakh)': l.value_lakh || 0,
      'Status': l.status?.toUpperCase() || 'OPEN',
      'Assigned To': l.assigned_to_name || 'N/A',
      'Next Follow-Up': l.next_followup_date || 'N/A',
    }));
    exportToCsv('Arihant_Sales_Funnel_Report', exportData);
  };

  const handleExportVisits = () => {
    const exportData = visits.map((v) => ({
      'Organisation': v.organisation_name || 'N/A',
      'Location': v.location || v.city || 'N/A',
      'Planned Date': v.planned_date,
      'Status': v.status?.toUpperCase() || 'PLANNED',
      'Representative': v.assignee_name || 'N/A',
      'Purpose': v.purpose || 'N/A',
      'Manager Intervention': v.manager_name ? `Directive by ${v.manager_name}` : 'None',
    }));
    exportToCsv('Arihant_Field_Visits_Report', exportData);
  };

  const handleExportExpenses = () => {
    const exportData = expenses.map((e) => ({
      'Employee': e.employee_name || 'N/A',
      'Date': e.expense_date,
      'Category': e.category?.toUpperCase() || 'TRAVEL',
      'Amount (INR)': e.amount,
      'Status': e.status?.toUpperCase(),
      'Purpose': e.purpose || 'N/A',
      'Manager': e.manager_name || 'N/A',
      'Manager Remarks': e.manager_remarks || 'N/A',
    }));
    exportToCsv('Arihant_Expenses_Audit_Report', exportData);
  };

  const handleExportService = () => {
    const exportData = tickets.map((s) => ({
      'Ticket No': s.ticket_no,
      'Customer': s.organisation_name || 'N/A',
      'Equipment Serial': s.equipment_serial || 'N/A',
      'Priority': s.priority?.toUpperCase(),
      'Warranty Status': s.warranty_status?.toUpperCase() || 'IN_WARRANTY',
      'Status': s.status?.toUpperCase(),
      'Engineer': s.assigned_to_name || 'N/A',
      'Complaint': s.complaint || 'N/A',
    }));
    exportToCsv('Arihant_Service_Desk_Report', exportData);
  };

  return (
    <PageContainer>
      {/* Top Banner */}
      <PageHeader
        badge="Executive Intelligence"
        title="Consolidated Operational Reports"
        subtitle="Consolidated enterprise data aggregates and business intelligence with direct CSV spreadsheet exports."
        icon={<FileText className="w-5 h-5 text-[#223FA7]" />}
        actions={
          <div className="flex items-center space-x-3">
            {activeTab === 'tenders' && (
              <Button variant="outline" onClick={handleExportTenders}>
                <Download className="h-4 w-4 mr-2" />
                Export Tenders CSV
              </Button>
            )}
            {activeTab === 'leads' && (
              <Button variant="outline" onClick={handleExportLeads}>
                <Download className="h-4 w-4 mr-2" />
                Export Funnel CSV
              </Button>
            )}
            {activeTab === 'visits' && (
              <Button variant="outline" onClick={handleExportVisits}>
                <Download className="h-4 w-4 mr-2" />
                Export Visits CSV
              </Button>
            )}
            {activeTab === 'expenses' && (
              <Button variant="outline" onClick={handleExportExpenses}>
                <Download className="h-4 w-4 mr-2" />
                Export Expenses CSV
              </Button>
            )}
            {activeTab === 'service' && (
              <Button variant="outline" onClick={handleExportService}>
                <Download className="h-4 w-4 mr-2" />
                Export Service CSV
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Highlights Bar */}
      <StatGrid cols={5}>
        <StatCard
          title="Live GeM Bids"
          value={tenders.length}
          icon={<FileText className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          title="Active Leads"
          value={leads.length}
          icon={<Target className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          title="Field Visits"
          value={visits.length}
          icon={<Calendar className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          title="Expense Claims"
          value={expenses.length}
          icon={<Receipt className="h-4 w-4" />}
          variant="amber"
        />
        <StatCard
          title="Service Tickets"
          value={tickets.length}
          icon={<Wrench className="h-4 w-4" />}
          variant="emerald"
        />
      </StatGrid>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'tenders', label: `GeM Bids (${tenders.length})` },
          { id: 'leads', label: `Sales Pipeline (${leads.length})` },
          { id: 'visits', label: `Field Itineraries (${visits.length})` },
          { id: 'expenses', label: `Expense Claims (${expenses.length})` },
          { id: 'service', label: `Service Desk (${tickets.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Content Body */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#5871A5]">
          Loading consolidated records...
        </div>
      ) : (
        <div className="bg-white border border-[#D6E3F5] rounded-2xl shadow-xs overflow-hidden">
          {activeTab === 'tenders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[#5871A5] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Bid Number</th>
                    <th className="p-3.5">Department / Org</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Qty</th>
                    <th className="p-3.5 text-right">EMD Fee</th>
                    <th className="p-3.5">Bid Closing</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenders.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-semibold text-[#223FA7]">{t.tender_no}</td>
                      <td className="p-3.5 text-[#1A1A1A]">{t.organisation_name || t.department || 'N/A'}</td>
                      <td className="p-3.5">
                        <Badge variant={t.category === 'pq' ? 'urgent' : 'outline'}>
                          {t.category?.toUpperCase() || 'GENERAL'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-medium">{t.quantity || '-'}</td>
                      <td className="p-3.5 text-right font-medium text-emerald-700">
                        {t.emd_fee ? formatINR(t.emd_fee) : 'Exempt'}
                      </td>
                      <td className="p-3.5 text-[#5871A5]">{t.bid_closing_date ? new Date(t.bid_closing_date).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[#5871A5] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Customer Organisation</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5">Probability</th>
                    <th className="p-3.5 text-right">Value (Lakh)</th>
                    <th className="p-3.5">Assigned Rep</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-medium text-[#1A1A1A]">{l.organisation_name}</td>
                      <td className="p-3.5 text-[#5871A5]">{l.product_name}</td>
                      <td className="p-3.5">
                        <Badge variant="outline">{l.category?.toUpperCase()}</Badge>
                      </td>
                      <td className="p-3.5 capitalize">{l.probability}</td>
                      <td className="p-3.5 text-right font-bold text-[#1A1A1A]">
                        {l.value_lakh ? `₹ ${l.value_lakh} L` : '-'}
                      </td>
                      <td className="p-3.5 text-[#5871A5]">{l.assigned_to_name || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[#5871A5] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Client & Destination</th>
                    <th className="p-3.5">Planned Date</th>
                    <th className="p-3.5">Sales Engineer</th>
                    <th className="p-3.5">Purpose</th>
                    <th className="p-3.5">Manager Also-Meet Directive</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-semibold text-[#1A1A1A]">{v.organisation_name}</p>
                        <p className="text-[11px] text-[#5871A5]">{v.location || v.city}</p>
                      </td>
                      <td className="p-3.5 text-[#5871A5]">{v.planned_date}</td>
                      <td className="p-3.5 text-[#1A1A1A] font-medium">{v.assignee_name}</td>
                      <td className="p-3.5 text-[#5871A5]">{v.purpose || 'Client meeting'}</td>
                      <td className="p-3.5">
                        {v.manager_name ? (
                          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            Directive by {v.manager_name}
                          </span>
                        ) : (
                          <span className="text-[#A1B3D3]">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[#5871A5] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5">Purpose</th>
                    <th className="p-3.5">Stage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-medium text-[#1A1A1A]">{e.employee_name}</td>
                      <td className="p-3.5 text-[#5871A5]">{e.expense_date}</td>
                      <td className="p-3.5 capitalize">{e.category?.replace('_', ' ')}</td>
                      <td className="p-3.5 text-right font-bold text-[#1A1A1A]">{formatINR(e.amount)}</td>
                      <td className="p-3.5 text-[#5871A5]">{e.purpose || 'Travel expense'}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800">
                          {e.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[#5871A5] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Ticket No</th>
                    <th className="p-3.5">Customer & Asset</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Warranty SLA</th>
                    <th className="p-3.5">Assigned Engineer</th>
                    <th className="p-3.5">Complaint Summary</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-semibold text-[#223FA7]">{s.ticket_no}</td>
                      <td className="p-3.5">
                        <p className="font-medium text-[#1A1A1A]">{s.organisation_name}</p>
                        <p className="text-[11px] text-[#5871A5]">S/N: {s.equipment_serial || 'N/A'}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={s.priority === 'critical' ? 'urgent' : 'outline'}>
                          {s.priority?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3.5 capitalize text-[#5871A5]">{s.warranty_status?.replace('_', ' ')}</td>
                      <td className="p-3.5 text-[#1A1A1A] font-medium">{s.assigned_to_name || 'Unassigned'}</td>
                      <td className="p-3.5 text-[#5871A5] max-w-xs truncate">{s.complaint}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800">
                          {s.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
