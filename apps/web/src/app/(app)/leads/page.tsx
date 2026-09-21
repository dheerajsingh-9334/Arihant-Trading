'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  Search,
  Plus,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  MapPin,
  Tag,
  Paperclip,
  Check,
  X,
  Send,
  MessageSquare,
  Users,
  ShieldCheck,
  Briefcase,
  Compass,
  DollarSign,
  AlertCircle,
  Eye,
  Edit,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  Input,
  Select,
  Textarea,
  Tabs,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { formatLakh, LeadStatus, LeadType, LeadLossReason, InteractionType, FollowUpStatus } from '@arihant/shared';

export default function LeadsPage() {
  const { user } = useAuth();

  // Active Workspace Tab: 'leads' | 'customers' | 'followups' | 'reports'
  const [activeTab, setActiveTab] = useState<string>('leads');

  // Master Data
  const [productsList, setProductsList] = useState<any[]>([]);
  const [sectorsList, setSectorsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [zonesList, setZonesList] = useState<any[]>([]);
  const [regionsList, setRegionsList] = useState<any[]>([]);

  // 1. Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadFilters, setLeadFilters] = useState({
    search: '',
    lead_status: '',
    lead_type: '',
    sector: '',
    lead_source: '',
  });

  // 2. Customers / Organisations State
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersTotalPages, setCustomersTotalPages] = useState(1);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // 3. Follow-ups Desk State
  const [followups, setFollowups] = useState<any[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [followupTimeframe, setFollowupTimeframe] = useState<string>('all');

  // 4. Executive Metrics HUD State
  const [leadStats, setLeadStats] = useState<any | null>(null);
  const [followupStats, setFollowupStats] = useState<any | null>(null);

  // 5. Executive Reports State
  const [reportSubTab, setReportSubTab] = useState<string>('salesperson');
  const [salespersonReport, setSalespersonReport] = useState<any[]>([]);
  const [zoneReport, setZoneReport] = useState<any[]>([]);
  const [productReport, setProductReport] = useState<any[]>([]);
  const [interactionReport, setInteractionReport] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Modal Dialogs State
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isCustomer360Open, setIsCustomer360Open] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isCompleteFollowupOpen, setIsCompleteFollowupOpen] = useState(false);
  const [isRescheduleFollowupOpen, setIsRescheduleFollowupOpen] = useState(false);

  // Selected Entities
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerTimeline, setCustomerTimeline] = useState<any[]>([]);
  const [customerContacts, setCustomerContacts] = useState<any[]>([]);
  const [customerLeads, setCustomerLeads] = useState<any[]>([]);
  const [customerTimelineLoading, setCustomerTimelineLoading] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<any | null>(null);

  // Form States
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create Lead Form
  const [leadForm, setLeadForm] = useState({
    title: '',
    organisation_mode: 'new' as 'new' | 'existing',
    organisation_id: '',
    organisation_name: '',
    department: '',
    city: '',
    state: '',
    sector: '',
    contact_name: '',
    contact_designation: '',
    contact_mobile: '',
    contact_email: '',
    assigned_to: '',
    regional_manager_id: '',
    source: 'field_visit',
    value_lakh: '',
    remarks: '',
    product_ids: [] as string[],
  });

  // Live Duplicate Detection Results
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [duplicateSuggestion, setDuplicateSuggestion] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Change Status Form
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [lossReason, setLossReason] = useState<string>('price');
  const [lossRemarks, setLossRemarks] = useState<string>('');

  // Reassign Salesperson Form
  const [newSalespersonId, setNewSalespersonId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  // Add Interaction Form
  const [interactionForm, setInteractionForm] = useState({
    lead_id: '',
    organisation_id: '',
    contact_id: '',
    type: 'call',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    outcome: '',
    next_action: '',
    next_followup_date: '',
    attachment_title: '',
    attachment_url: '',
  });

  // Follow-up Completion Form
  const [completionOutcome, setCompletionOutcome] = useState('');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [scheduleNextFollowup, setScheduleNextFollowup] = useState(false);
  const [nextFollowupDueDate, setNextFollowupDueDate] = useState('');

  // Follow-up Reschedule Form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleRemarks, setRescheduleRemarks] = useState('');

  // Load Master Data on Mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [prodRes, secRes, usrRes, znRes, regRes] = await Promise.allSettled([
          api.get('/masters/products'),
          api.get('/masters/sectors'),
          api.get('/users'),
          api.get('/masters/zones'),
          api.get('/masters/regions'),
        ]);

        if (prodRes.status === 'fulfilled') setProductsList(prodRes.value.data || prodRes.value || []);
        if (secRes.status === 'fulfilled') setSectorsList(secRes.value.data || secRes.value || []);
        if (usrRes.status === 'fulfilled') setUsersList(usrRes.value.data || usrRes.value || []);
        if (znRes.status === 'fulfilled') setZonesList(znRes.value.data || znRes.value || []);
        if (regRes.status === 'fulfilled') setRegionsList(regRes.value.data || regRes.value || []);
      } catch (err) {
        console.error('Failed to load masters:', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const [lDash, fDash] = await Promise.allSettled([
        api.get('/leads/dashboard'),
        api.get('/follow-ups/metrics'),
      ]);
      if (lDash.status === 'fulfilled') setLeadStats(lDash.value);
      if (fDash.status === 'fulfilled') setFollowupStats(fDash.value);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  }, []);

  // Fetch Leads Register
  const fetchLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const res = await api.get('/leads', {
        page: leadsPage,
        limit: 15,
        search: leadFilters.search || undefined,
        lead_status: leadFilters.lead_status || undefined,
        lead_type: leadFilters.lead_type || undefined,
        sector: leadFilters.sector || undefined,
        source: leadFilters.lead_source || undefined,
      });

      const list = Array.isArray(res) ? res : (res?.data || []);
      setLeads(list);
      setLeadsTotal(res?.total ?? list.length);
      setLeadsTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage, leadFilters]);

  // Fetch Customers Register
  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const res = await api.get('/organisations', {
        page: customersPage,
        limit: 15,
        search: customerSearch || undefined,
      });

      const list = Array.isArray(res) ? res : (res?.data || []);
      setCustomers(list);
      setCustomersTotal(res?.total ?? list.length);
      setCustomersTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [customersPage, customerSearch]);

  // Fetch Follow-ups Desk
  const fetchFollowups = useCallback(async () => {
    try {
      setFollowupsLoading(true);
      const tf =
        followupTimeframe === 'today'
          ? 'due_today'
          : followupTimeframe !== 'all' && followupTimeframe !== 'completed'
          ? followupTimeframe
          : undefined;

      const res = await api.get('/follow-ups', {
        timeframe: tf,
        status: followupTimeframe === 'completed' ? 'completed' : undefined,
        limit: 50,
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFollowups(list);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setFollowups([]);
    } finally {
      setFollowupsLoading(false);
    }
  }, [followupTimeframe]);

  // Fetch Executive Reports
  const fetchReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const [spRes, znRes, prRes, inRes] = await Promise.allSettled([
        api.get('/leads/reports/salesperson'),
        api.get('/leads/reports/zones'),
        api.get('/leads/reports/products'),
        api.get('/leads/reports/interactions'),
      ]);

      if (spRes.status === 'fulfilled') {
        const val = spRes.value;
        setSalespersonReport(Array.isArray(val) ? val : (val?.data || []));
      }
      if (znRes.status === 'fulfilled') {
        const val = znRes.value;
        setZoneReport(Array.isArray(val) ? val : (val?.data || []));
      }
      if (prRes.status === 'fulfilled') {
        const val = prRes.value;
        setProductReport(Array.isArray(val) ? val : (val?.data || []));
      }
      if (inRes.status === 'fulfilled') {
        const val = inRes.value;
        setInteractionReport(Array.isArray(val) ? val : (val?.data || []));
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Initial and reactive data fetching
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
    else if (activeTab === 'customers') fetchCustomers();
    else if (activeTab === 'followups') fetchFollowups();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchLeads, fetchCustomers, fetchFollowups, fetchReports]);

  // Debounced Duplicate Detection during Lead Creation
  useEffect(() => {
    if (!isCreateLeadOpen || leadForm.organisation_mode === 'existing') {
      setDuplicateMatches([]);
      setDuplicateSuggestion(null);
      return;
    }

    const queryOrg = leadForm.organisation_name.trim();
    const queryEmail = leadForm.contact_email.trim();
    const queryPhone = leadForm.contact_mobile.trim();

    if (queryOrg.length < 3 && queryEmail.length < 5 && queryPhone.length < 6) {
      setDuplicateMatches([]);
      setDuplicateSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingDuplicate(true);
        const res = await api.get('/organisations/check-duplicate', {
          name: queryOrg || undefined,
          email: queryEmail || undefined,
          phone: queryPhone || undefined,
        });
        if (res?.isDuplicate && res.matches?.length > 0) {
          setDuplicateMatches(res.matches);
          setDuplicateSuggestion(res.suggestion);
        } else {
          setDuplicateMatches([]);
          setDuplicateSuggestion(null);
        }
      } catch (err) {
        // Silently handle
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [leadForm.organisation_name, leadForm.contact_email, leadForm.contact_mobile, isCreateLeadOpen, leadForm.organisation_mode]);

  // Open Lead Details Modal
  const handleOpenLead = async (leadId: string) => {
    try {
      const fullLead = await api.get(`/leads/${leadId}`);
      setSelectedLead(fullLead);
      setIsLeadDetailOpen(true);
    } catch (err: any) {
      console.error('Failed to inspect lead:', err);
    }
  };

  // Open Customer 360 Account Drawer
  const handleOpenCustomer360 = async (orgId: string) => {
    try {
      setCustomerTimelineLoading(true);
      setIsCustomer360Open(true);
      const [orgRes, timelineRes, contactsRes, leadsRes] = await Promise.allSettled([
        api.get(`/organisations/${orgId}`),
        api.get(`/organisations/${orgId}/timeline`),
        api.get(`/contacts?organisation_id=${orgId}`),
        api.get(`/leads?organisation_id=${orgId}&limit=50`),
      ]);

      if (orgRes.status === 'fulfilled') setSelectedCustomer(orgRes.value);
      if (timelineRes.status === 'fulfilled') setCustomerTimeline(timelineRes.value.interactions || []);
      if (contactsRes.status === 'fulfilled') setCustomerContacts(contactsRes.value || []);
      if (leadsRes.status === 'fulfilled') setCustomerLeads(leadsRes.value.data || []);
    } catch (err) {
      console.error('Failed to load customer 360:', err);
    } finally {
      setCustomerTimelineLoading(false);
    }
  };

  // Handle Create Lead Submission
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    try {
      let orgId = leadForm.organisation_id;
      let contactId: string | undefined = undefined;

      // 1. If new organisation mode, create or resolve organisation
      if (leadForm.organisation_mode === 'new') {
        const orgRes = await api.post('/organisations', {
          name: leadForm.organisation_name.trim(),
          department: leadForm.department.trim() || undefined,
          city: leadForm.city.trim() || undefined,
          state: leadForm.state.trim() || undefined,
          sector: leadForm.sector || undefined,
        });
        orgId = orgRes.id;
      }

      // 2. Create contact if details provided
      if (leadForm.contact_name.trim() && orgId) {
        const contactRes = await api.post('/contacts', {
          organisation_id: orgId,
          name: leadForm.contact_name.trim(),
          designation: leadForm.contact_designation.trim() || undefined,
          phone: leadForm.contact_mobile.trim() || undefined,
          email: leadForm.contact_email.trim() || undefined,
          is_primary: true,
        });
        contactId = contactRes.id;
      }

      // 3. Create lead (automatically classifies Fresh vs Re-Approached)
      const createdLead = await api.post('/leads', {
        title: leadForm.title.trim(),
        organisation_id: orgId,
        primary_contact_id: contactId,
        assigned_to: leadForm.assigned_to || user?.id,
        regional_manager_id: leadForm.regional_manager_id || undefined,
        source: leadForm.source,
        value_lakh: leadForm.value_lakh ? Number(leadForm.value_lakh) : undefined,
        remarks: leadForm.remarks.trim() || undefined,
        product_ids: leadForm.product_ids.length > 0 ? leadForm.product_ids : undefined,
      });

      setIsCreateLeadOpen(false);
      resetLeadForm();
      fetchLeads();
      fetchDashboardStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register lead.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetLeadForm = () => {
    setLeadForm({
      title: '',
      organisation_mode: 'new',
      organisation_id: '',
      organisation_name: '',
      department: '',
      city: '',
      state: '',
      sector: '',
      contact_name: '',
      contact_designation: '',
      contact_mobile: '',
      contact_email: '',
      assigned_to: '',
      regional_manager_id: '',
      source: 'field_visit',
      value_lakh: '',
      remarks: '',
      product_ids: [],
    });
    setDuplicateMatches([]);
    setDuplicateSuggestion(null);
  };

  // Status Change Submission
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormError(null);
    setActionLoading(true);

    try {
      await api.patch(`/leads/${selectedLead.id}/status`, {
        status: targetStatus,
        loss_reason: targetStatus === 'lost' ? lossReason : undefined,
        loss_remarks: targetStatus === 'lost' ? lossRemarks : undefined,
      });

      setIsStatusModalOpen(false);
      const updated = await api.get(`/leads/${selectedLead.id}`);
      setSelectedLead(updated);
      fetchLeads();
      fetchDashboardStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update lead status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reassign Salesperson Submission
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormError(null);
    setActionLoading(true);

    try {
      await api.patch(`/leads/${selectedLead.id}/assign`, {
        assigned_to: newSalespersonId,
        reason: reassignReason || undefined,
      });

      setIsReassignModalOpen(false);
      const updated = await api.get(`/leads/${selectedLead.id}`);
      setSelectedLead(updated);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to reassign salesperson.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Product Interest to Selected Lead
  const handleAddProductInterest = async (productId: string) => {
    if (!selectedLead) return;
    try {
      await api.post(`/leads/${selectedLead.id}/products`, { product_id: productId });
      const updated = await api.get(`/leads/${selectedLead.id}`);
      setSelectedLead(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to attach product.');
    }
  };

  // Remove Product Interest from Selected Lead
  const handleRemoveProductInterest = async (productId: string) => {
    if (!selectedLead) return;
    try {
      await api.delete(`/leads/${selectedLead.id}/products/${productId}`);
      const updated = await api.get(`/leads/${selectedLead.id}`);
      setSelectedLead(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove product.');
    }
  };

  // Log Interaction Submission
  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    try {
      await api.post('/interactions', {
        lead_id: interactionForm.lead_id || undefined,
        organisation_id: interactionForm.organisation_id,
        contact_id: interactionForm.contact_id || undefined,
        type: interactionForm.type,
        interaction_date: interactionForm.date,
        notes: interactionForm.notes,
        outcome: interactionForm.outcome || undefined,
        next_action: interactionForm.next_action || undefined,
        next_followup_date: interactionForm.next_followup_date || undefined,
        attachments:
          interactionForm.attachment_title && interactionForm.attachment_url
            ? [
                {
                  file_name: interactionForm.attachment_title,
                  file_url: interactionForm.attachment_url,
                },
              ]
            : undefined,
      });

      setIsLogInteractionOpen(false);
      setInteractionForm({
        lead_id: '',
        organisation_id: '',
        contact_id: '',
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        outcome: '',
        next_action: '',
        next_followup_date: '',
        attachment_title: '',
        attachment_url: '',
      });

      if (selectedLead) {
        const updated = await api.get(`/leads/${selectedLead.id}`);
        setSelectedLead(updated);
      }
      if (selectedCustomer) {
        handleOpenCustomer360(selectedCustomer.id);
      }
      fetchLeads();
      fetchFollowups();
      fetchDashboardStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to log interaction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Follow-up Completion Submission
  const handleCompleteFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setFormError(null);
    setActionLoading(true);

    try {
      await api.patch(`/follow-ups/${selectedFollowup.id}/complete`, {
        outcome: completionOutcome || undefined,
        remarks: completionRemarks || undefined,
        next_followup_date: scheduleNextFollowup && nextFollowupDueDate ? nextFollowupDueDate : undefined,
      });

      setIsCompleteFollowupOpen(false);
      setSelectedFollowup(null);
      setCompletionOutcome('');
      setCompletionRemarks('');
      setScheduleNextFollowup(false);
      setNextFollowupDueDate('');
      fetchFollowups();
      fetchDashboardStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete follow-up.');
    } finally {
      setActionLoading(false);
    }
  };

  // Follow-up Reschedule Submission
  const handleRescheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setFormError(null);
    setActionLoading(true);

    try {
      await api.patch(`/follow-ups/${selectedFollowup.id}/reschedule`, {
        new_due_date: rescheduleDate,
        remarks: rescheduleRemarks || undefined,
      });

      setIsRescheduleFollowupOpen(false);
      setSelectedFollowup(null);
      setRescheduleDate('');
      setRescheduleRemarks('');
      fetchFollowups();
      fetchDashboardStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to reschedule follow-up.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'new':
        return <Badge variant="info" size="sm">NEW</Badge>;
      case 'contacted':
        return <Badge variant="outline" size="sm">CONTACTED</Badge>;
      case 'qualified':
        return <Badge variant="success" size="sm">QUALIFIED</Badge>;
      case 'follow_up':
        return <Badge variant="warning" size="sm">FOLLOW-UP</Badge>;
      case 'demo':
        return <Badge variant="cyber" size="sm">DEMO SCHEDULED</Badge>;
      case 'proposal':
        return <Badge variant="info" size="sm">PROPOSAL</Badge>;
      case 'tender_discussion':
        return <Badge variant="outline" size="sm">TENDER DISCUSSION</Badge>;
      case 'negotiation':
        return <Badge variant="warning" size="sm">NEGOTIATION</Badge>;
      case 'converted':
        return <Badge variant="success" size="sm">CONVERTED (WON)</Badge>;
      case 'lost':
        return <Badge variant="danger" size="sm">LOST</Badge>;
      case 'on_hold':
        return <Badge variant="default" size="sm">ON HOLD</Badge>;
      default:
        return <Badge variant="default" size="sm">{status?.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <PageHeader
        moduleBadge="Module 01"
        tagline="ACCOUNT DISCOVERY & SALES PIPELINE COMMAND CENTER"
        title="Lead & Customer Management"
        description="Enterprise CRM pipeline with transactional outbox events, automatic Fresh vs Re-Approached prospect classification, immutable salesperson audit logs, and unified 360° customer timeline."
        icon={<Target className="h-7 w-7 text-[#223FA7]" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchDashboardStats();
                if (activeTab === 'leads') fetchLeads();
                else if (activeTab === 'customers') fetchCustomers();
                else if (activeTab === 'followups') fetchFollowups();
                else if (activeTab === 'reports') fetchReports();
              }}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetLeadForm();
                setIsCreateLeadOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Opportunity / Lead
            </Button>
          </div>
        }
      />

      {/* 2. Executive Metric Cards HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard
          label="Active Pipeline"
          value={leadStats?.active_leads ?? '—'}
          subtext={`Total Leads: ${leadStats?.total_leads ?? 0}`}
          variant="primary"
          icon={<Compass className="h-4 w-4 text-[#223FA7]" />}
        />
        <StatCard
          label="Fresh Prospects"
          value={leadStats?.fresh_leads ?? '—'}
          subtext="First-time Accounts"
          variant="emerald"
          icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          label="Re-Approached"
          value={leadStats?.reapproached_leads ?? '—'}
          subtext="Repeat Engagements"
          variant="amber"
          icon={<Layers className="h-4 w-4 text-amber-600" />}
        />
        <StatCard
          label="Follow-ups Due Today"
          value={followupStats?.dueToday ?? followupStats?.due_today ?? '—'}
          subtext={`Overdue: ${followupStats?.overdue ?? 0}`}
          variant={Number(followupStats?.overdue) > 0 ? 'rose' : 'amber'}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
        <StatCard
          label="Converted Deals"
          value={leadStats?.converted_leads ?? '—'}
          subtext={`Lost: ${leadStats?.lost_leads ?? 0}`}
          variant="emerald"
          icon={<Award className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      {/* 3. Primary Workspace Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D6E3F5] pb-2">
        <Tabs
          variant="segmented"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'leads', label: 'Lead Register & Pipeline', icon: <Target className="h-4 w-4" />, count: leadsTotal },
            { id: 'customers', label: 'Customer Register (360°)', icon: <Building className="h-4 w-4" />, count: customersTotal },
            { id: 'followups', label: 'Follow-ups Desk', icon: <Clock className="h-4 w-4" />, count: (followupStats?.dueToday ?? followupStats?.due_today) ? `${followupStats?.dueToday ?? followupStats?.due_today} today` : undefined },
            { id: 'reports', label: 'Executive Intelligence Reports', icon: <TrendingUp className="h-4 w-4" /> },
          ]}
        />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LEAD REGISTER & PIPELINE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filters Strip */}
          <div className="p-3 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5871A5]" />
                <input
                  type="text"
                  placeholder="Search lead, client, salesperson..."
                  value={leadFilters.search}
                  onChange={(e) => setLeadFilters({ ...leadFilters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg text-[#1A1A1A] placeholder-[#5871A5] focus:outline-none focus:border-[#223FA7]"
                />
              </div>

              <select
                value={leadFilters.lead_status}
                onChange={(e) => setLeadFilters({ ...leadFilters, lead_status: e.target.value })}
                className="px-2.5 py-1.5 text-xs bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#223FA7]"
              >
                <option value="">All Lifecycle Stages</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="follow_up">Follow-Up Stage</option>
                <option value="demo">Demo Scheduled</option>
                <option value="proposal">Proposal Sent</option>
                <option value="tender_discussion">Tender Discussion</option>
                <option value="negotiation">Negotiation</option>
                <option value="converted">Converted (Won)</option>
                <option value="lost">Lost</option>
                <option value="on_hold">On Hold</option>
              </select>

              <select
                value={leadFilters.lead_type}
                onChange={(e) => setLeadFilters({ ...leadFilters, lead_type: e.target.value })}
                className="px-2.5 py-1.5 text-xs bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#223FA7]"
              >
                <option value="">All Lead Types</option>
                <option value="fresh">Fresh Accounts</option>
                <option value="re_approached">Re-Approached Accounts</option>
              </select>

              <select
                value={leadFilters.lead_source}
                onChange={(e) => setLeadFilters({ ...leadFilters, lead_source: e.target.value })}
                className="px-2.5 py-1.5 text-xs bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#223FA7]"
              >
                <option value="">All Sources</option>
                <option value="field_visit">Field Visit</option>
                <option value="referral">Referral</option>
                <option value="tender">Tender</option>
                <option value="exhibition">Exhibition</option>
                <option value="website">Website</option>
                <option value="cold_outreach">Cold Outreach</option>
              </select>
            </div>

            <div className="text-xs text-[#5871A5] font-medium">
              Showing {leads.length} of {leadsTotal} opportunities
            </div>
          </div>

          {/* Leads Table */}
          {leadsLoading ? (
            <div className="p-12 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              Loading pipeline opportunities...
            </div>
          ) : leads.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No opportunities match your filter"
              description="Try adjusting your stage, type, or search filters, or register a new lead."
              action={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    resetLeadForm();
                    setIsCreateLeadOpen(true);
                  }}
                >
                  Create Opportunity
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity / Title</TableHead>
                  <TableHead>Organisation & Sector</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Salesperson / RM</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Stage / Status</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Next Follow-Up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="group cursor-pointer" onClick={() => handleOpenLead(lead.id)}>
                    <TableCell>
                      <div className="font-bold text-[#1A1A1A] group-hover:text-[#223FA7] transition-colors line-clamp-1">
                        {lead.title}
                      </div>
                      <div className="text-[10px] text-[#5871A5] font-mono">
                        ID: {lead.id.slice(0, 8)}... • Source: {lead.source || 'direct'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-[#5871A5] shrink-0" />
                        <span className="truncate">{lead.organisation_name || '—'}</span>
                      </div>
                      <div className="text-[10px] text-[#5871A5]">
                        {lead.sector || 'Defence / Security'}
                      </div>
                    </TableCell>

                    <TableCell>
                      {lead.contact_name ? (
                        <div>
                          <div className="font-medium text-[#1A1A1A] flex items-center gap-1">
                            <User className="h-3 w-3 text-[#5871A5]" />
                            <span>{lead.contact_name}</span>
                          </div>
                          <div className="text-[10px] text-[#5871A5]">
                            {lead.contact_designation || lead.contact_phone || '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#5871A5] italic text-[11px]">Unspecified</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {lead.lead_type === 're_approached' ? (
                        <Badge variant="warning" size="sm" className="font-bold text-[10px]">
                          RE-APPROACHED
                        </Badge>
                      ) : (
                        <Badge variant="info" size="sm" className="font-bold text-[10px]">
                          FRESH
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-gray-800">
                        {lead.assigned_salesperson_name || 'Unassigned'}
                      </div>
                      {lead.regional_manager_name && (
                        <div className="text-[10px] text-[#5871A5]">
                          RM: {lead.regional_manager_name}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {lead.product_interests && lead.product_interests.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {lead.product_interests.slice(0, 2).map((p: any) => (
                            <span
                              key={p.id}
                              className="px-1.5 py-0.5 rounded bg-[#EAF2FF] text-[#223FA7] text-[10px] font-medium truncate"
                            >
                              {p.name}
                            </span>
                          ))}
                          {lead.product_interests.length > 2 && (
                            <span className="text-[10px] text-[#5871A5]">
                              +{lead.product_interests.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#5871A5] italic text-[10px]">None tagged</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(lead.lead_status || lead.status)}
                    </TableCell>

                    <TableCell>
                      <span className="font-extrabold text-[#223FA7]">
                        {formatLakh(lead.value_lakh || lead.estimated_value_lakh || 0)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {lead.next_followup_at || lead.next_followup_date ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-gray-700">
                          <Calendar className="h-3 w-3 text-[#5871A5]" />
                          <span>
                            {new Date(lead.next_followup_at || lead.next_followup_date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#5871A5] italic text-[10px]">None set</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            setInteractionForm({
                              ...interactionForm,
                              lead_id: lead.id,
                              organisation_id: lead.organisation_id,
                              contact_id: lead.primary_contact_id || '',
                            });
                            setIsLogInteractionOpen(true);
                          }}
                          leftIcon={<MessageSquare className="h-3 w-3" />}
                        >
                          Log Touch
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenLead(lead.id)}
                          leftIcon={<Eye className="h-3 w-3" />}
                        >
                          Inspect
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {leadsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#5871A5]">
                Page {leadsPage} of {leadsTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={leadsPage <= 1}
                  onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={leadsPage >= leadsTotalPages}
                  onClick={() => setLeadsPage((p) => Math.min(leadsTotalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER REGISTER & 360° ACCOUNT VIEW                             */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="p-3 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5871A5]" />
              <input
                type="text"
                placeholder="Search organisations by name, city, sector..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7FBFF] border border-[#D6E3F5] rounded-lg text-[#1A1A1A] placeholder-[#5871A5] focus:outline-none focus:border-[#223FA7]"
              />
            </div>
            <div className="text-xs text-[#5871A5] font-medium">
              Total {customersTotal} accounts in system
            </div>
          </div>

          {customersLoading ? (
            <div className="p-12 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              Loading customer accounts...
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No customer accounts found"
              description="No organisations match your search. Create an opportunity to auto-register an account."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Sector / Category</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Current Sales Owner</TableHead>
                  <TableHead>Pipeline Status</TableHead>
                  <TableHead>Latest Touchpoint</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((org) => (
                  <TableRow
                    key={org.id}
                    className="group cursor-pointer"
                    onClick={() => handleOpenCustomer360(org.id)}
                  >
                    <TableCell>
                      <div className="font-bold text-[#1A1A1A] group-hover:text-[#223FA7] transition-colors flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-[#223FA7] shrink-0" />
                        <span>{org.name}</span>
                      </div>
                      {org.department && (
                        <div className="text-[10px] text-[#5871A5]">{org.department}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-gray-800 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#5871A5]" />
                        <span>{org.city || '—'}, {org.state || '—'}</span>
                      </div>
                      {org.zone_name && (
                        <div className="text-[10px] text-[#5871A5]">{org.zone_name} Zone</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#D6E3F5] text-[11px] font-medium text-gray-700">
                        {org.sector || 'Government / PSU'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {org.primary_contact ? (
                        <div>
                          <div className="font-medium text-[#1A1A1A]">
                            {org.primary_contact.name}
                          </div>
                          <div className="text-[10px] text-[#5871A5]">
                            {org.primary_contact.phone || org.primary_contact.email || org.primary_contact.designation || '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#5871A5] italic text-[11px]">No contact set</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-gray-800">
                        {org.current_salesperson || 'Unassigned'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {org.lead_status ? getStatusBadge(org.lead_status) : (
                        <span className="text-[#5871A5] text-[10px] italic">No active lead</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {org.last_interaction_at ? (
                        <div className="text-[11px] font-mono text-gray-700">
                          {new Date(org.last_interaction_at).toLocaleDateString('en-IN')}
                        </div>
                      ) : (
                        <span className="text-[#5871A5] italic text-[10px]">No interactions</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomer360(org.id);
                        }}
                        rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                      >
                        360° View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {customersTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#5871A5]">
                Page {customersPage} of {customersTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={customersPage <= 1}
                  onClick={() => setCustomersPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={customersPage >= customersTotalPages}
                  onClick={() => setCustomersPage((p) => Math.min(customersTotalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FOLLOW-UPS DESK                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Follow-ups' },
                { id: 'today', label: `Due Today (${followupStats?.dueToday ?? followupStats?.due_today ?? 0})` },
                { id: 'overdue', label: `Overdue (${followupStats?.overdue ?? 0})` },
                { id: 'upcoming', label: `Upcoming (${followupStats?.upcoming ?? 0})` },
                { id: 'completed', label: `Completed (${followupStats?.completed ?? 0})` },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFollowupTimeframe(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    followupTimeframe === chip.id
                      ? 'bg-[#223FA7] text-white shadow-xs'
                      : 'bg-[#F7FBFF] text-[#5871A5] hover:bg-[#EAF2FF] hover:text-[#223FA7] border border-[#D6E3F5]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#5871A5]">
              Total {followups.length} follow-ups displayed
            </span>
          </div>

          {followupsLoading ? (
            <div className="p-12 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              Loading follow-ups desk...
            </div>
          ) : followups.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No follow-ups in this queue"
              description="You have no pending follow-up touchpoints matching this timeframe."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Client & Opportunity</TableHead>
                  <TableHead>Contact Officer</TableHead>
                  <TableHead>Assigned Salesperson</TableHead>
                  <TableHead>Follow-up Objective / Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followups.map((fu) => {
                  const isOverdue =
                    fu.status === 'pending' &&
                    new Date(fu.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
                  const isToday =
                    fu.status === 'pending' &&
                    new Date(fu.due_date).toDateString() === new Date().toDateString();

                  return (
                    <TableRow key={fu.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-[#223FA7]'}`} />
                          <span className="font-mono font-bold text-xs text-[#1A1A1A]">
                            {new Date(fu.due_date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        {isOverdue && (
                          <Badge variant="danger" size="sm" className="mt-1 text-[10px]">
                            OVERDUE
                          </Badge>
                        )}
                        {isToday && (
                          <Badge variant="warning" size="sm" className="mt-1 text-[10px]">
                            DUE TODAY
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-[#1A1A1A] line-clamp-1">
                          {fu.organisation_name || 'Organisation'}
                        </div>
                        {fu.lead_title && (
                          <div className="text-[10px] text-[#223FA7] font-medium line-clamp-1">
                            Deal: {fu.lead_title}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {fu.contact_name ? (
                          <div>
                            <div className="font-medium text-[#1A1A1A]">{fu.contact_name}</div>
                            <div className="text-[10px] text-[#5871A5]">{fu.contact_phone || '—'}</div>
                          </div>
                        ) : (
                          <span className="text-[#5871A5] italic text-[11px]">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-gray-800 text-xs">
                          {fu.assigned_salesperson_name || 'Sales Officer'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-gray-700 leading-snug max-w-sm line-clamp-2">
                          {fu.remarks || 'Standard pipeline follow-up'}
                        </p>
                        {fu.outcome && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Outcome: {fu.outcome}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {fu.status === 'completed' ? (
                          <Badge variant="success" size="sm">COMPLETED</Badge>
                        ) : fu.status === 'cancelled' ? (
                          <Badge variant="default" size="sm">CANCELLED</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">PENDING</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {fu.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="success"
                              onClick={() => {
                                setSelectedFollowup(fu);
                                setCompletionOutcome('');
                                setCompletionRemarks('');
                                setScheduleNextFollowup(false);
                                setNextFollowupDueDate('');
                                setIsCompleteFollowupOpen(true);
                              }}
                              leftIcon={<Check className="h-3 w-3" />}
                            >
                              Complete
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setSelectedFollowup(fu);
                                setRescheduleDate(fu.due_date);
                                setRescheduleRemarks('');
                                setIsRescheduleFollowupOpen(true);
                              }}
                            >
                              Reschedule
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXECUTIVE INTELLIGENCE REPORTS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-1.5 bg-[#EEF5FF] border border-[#D6E3F5] rounded-xl w-fit">
            {[
              { id: 'salesperson', label: 'Salesperson Performance', icon: <Users className="h-3.5 w-3.5" /> },
              { id: 'zones', label: 'Territorial Zone Breakdown', icon: <Compass className="h-3.5 w-3.5" /> },
              { id: 'products', label: 'Product Demand Intelligence', icon: <Briefcase className="h-3.5 w-3.5" /> },
              { id: 'interactions', label: 'Field Activity Breakdown', icon: <MessageSquare className="h-3.5 w-3.5" /> },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setReportSubTab(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  reportSubTab === sub.id
                    ? 'bg-white text-[#223FA7] shadow-xs border border-[#D6E3F5]'
                    : 'text-[#5871A5] hover:text-[#1A1A1A]'
                }`}
              >
                {sub.icon}
                <span>{sub.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-report 1: Salesperson Performance */}
          {reportSubTab === 'salesperson' && (
            <Card>
              <CardHeader>
                <CardTitle>Salesperson Conversion & Pipeline Ownership</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesperson Name</TableHead>
                      <TableHead>Total Assigned Leads</TableHead>
                      <TableHead>Fresh Leads</TableHead>
                      <TableHead>Re-Approached</TableHead>
                      <TableHead>Active Deals</TableHead>
                      <TableHead>Converted (Won)</TableHead>
                      <TableHead>Lost Deals</TableHead>
                      <TableHead>Pending Follow-ups</TableHead>
                      <TableHead>Overdue Follow-ups</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salespersonReport.map((sp) => (
                      <TableRow key={sp.salesperson_id}>
                        <TableCell className="font-bold text-[#1A1A1A]">
                          {sp.salesperson_name}
                        </TableCell>
                        <TableCell className="font-semibold text-center">{sp.total_leads}</TableCell>
                        <TableCell className="text-center font-medium text-emerald-700">{sp.fresh_leads}</TableCell>
                        <TableCell className="text-center font-medium text-amber-700">{sp.reapproached_leads}</TableCell>
                        <TableCell className="text-center font-bold text-[#223FA7]">{sp.active_leads}</TableCell>
                        <TableCell className="text-center font-extrabold text-emerald-700">{sp.converted_leads}</TableCell>
                        <TableCell className="text-center text-red-700 font-medium">{sp.lost_leads}</TableCell>
                        <TableCell className="text-center font-mono">{sp.pending_followups}</TableCell>
                        <TableCell className="text-center">
                          {Number(sp.overdue_followups) > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                              {sp.overdue_followups}
                            </span>
                          ) : (
                            <span className="text-[#5871A5] font-mono">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-report 2: Territorial Zone Breakdown */}
          {reportSubTab === 'zones' && (
            <Card>
              <CardHeader>
                <CardTitle>Territorial Zone & Regional Pipeline Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-center">Total Leads</TableHead>
                      <TableHead className="text-center">Fresh Leads</TableHead>
                      <TableHead className="text-center">Re-Approached</TableHead>
                      <TableHead className="text-center">Converted (Won)</TableHead>
                      <TableHead className="text-center">Lost Deals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneReport.map((z, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-[#1A1A1A]">{z.zone_name}</TableCell>
                        <TableCell className="font-medium text-gray-700">{z.region_name}</TableCell>
                        <TableCell className="text-center font-bold text-[#223FA7]">{z.total_leads}</TableCell>
                        <TableCell className="text-center font-semibold text-emerald-700">{z.fresh_leads}</TableCell>
                        <TableCell className="text-center font-semibold text-amber-700">{z.reapproached_leads}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-700">{z.converted_leads}</TableCell>
                        <TableCell className="text-center font-medium text-red-700">{z.lost_leads}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-report 3: Product Demand Intelligence */}
          {reportSubTab === 'products' && (
            <Card>
              <CardHeader>
                <CardTitle>Product Demand & Inquiry Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Total Lead Inquiries</TableHead>
                      <TableHead className="text-center">Active Pipeline Deals</TableHead>
                      <TableHead className="text-center">Converted Deals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productReport.map((p) => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-bold text-[#1A1A1A]">{p.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" size="sm">{p.category?.toUpperCase() || 'DEFENCE'}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-[#223FA7]">{p.total_leads}</TableCell>
                        <TableCell className="text-center font-semibold text-amber-700">{p.active_leads}</TableCell>
                        <TableCell className="text-center font-extrabold text-emerald-700">{p.converted_leads}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-report 4: Field Activity Breakdown */}
          {reportSubTab === 'interactions' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {interactionReport.map((ir, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs hover:border-[#9FC0F5] transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5871A5] block mb-1">
                      Channel
                    </span>
                    <Badge variant="outline" size="sm" className="font-bold uppercase">
                      {ir.interaction_type}
                    </Badge>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#D6E3F5] flex items-baseline justify-between">
                    <span className="text-[10px] text-[#5871A5] font-semibold">Total Logged</span>
                    <span className="text-xl font-extrabold text-[#223FA7]">
                      {ir.total_interactions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE LEAD / OPPORTUNITY (WITH LIVE DUPLICATE DETECTION)        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        title="Register New Lead Opportunity"
        description="Capture upcoming defence/security procurement requirements with automatic duplicate prevention & Fresh classification."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Opportunity Title */}
          <Input
            label="Opportunity Title *"
            required
            value={leadForm.title}
            onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
            placeholder="e.g. 50x Bomb Blankets for Rapid Action Force HQ"
          />

          {/* Account Mode Toggle */}
          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Organisation Account Details
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLeadForm({ ...leadForm, organisation_mode: 'new' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    leadForm.organisation_mode === 'new'
                      ? 'bg-[#223FA7] text-white'
                      : 'bg-white text-[#5871A5] border border-[#D6E3F5]'
                  }`}
                >
                  Create New Account
                </button>
                <button
                  type="button"
                  onClick={() => setLeadForm({ ...leadForm, organisation_mode: 'existing' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    leadForm.organisation_mode === 'existing'
                      ? 'bg-[#223FA7] text-white'
                      : 'bg-white text-[#5871A5] border border-[#D6E3F5]'
                  }`}
                >
                  Link Existing Account
                </button>
              </div>
            </div>

            {/* If New Organisation Mode */}
            {leadForm.organisation_mode === 'new' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Organisation / Agency Name *"
                    required
                    value={leadForm.organisation_name}
                    onChange={(e) => setLeadForm({ ...leadForm, organisation_name: e.target.value })}
                    placeholder="e.g. Central Reserve Police Force"
                  />
                  <Input
                    label="Department / Unit"
                    value={leadForm.department}
                    onChange={(e) => setLeadForm({ ...leadForm, department: e.target.value })}
                    placeholder="e.g. Procurement & Ordnance Branch"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                  />
                  <Input
                    label="State"
                    value={leadForm.state}
                    onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
                    placeholder="e.g. Delhi"
                  />
                  <Select
                    label="Sector"
                    value={leadForm.sector}
                    onChange={(e) => setLeadForm({ ...leadForm, sector: e.target.value })}
                    options={[
                      { value: '', label: 'Select Sector' },
                      ...sectorsList.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>

                {/* Duplicate Detection Alert Banner */}
                {isCheckingDuplicate && (
                  <div className="text-[11px] text-[#5871A5] italic">
                    Checking account database for duplicate records...
                  </div>
                )}
                {duplicateMatches.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>Possible Duplicate Organisation Detected!</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      {duplicateSuggestion}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {duplicateMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200"
                        >
                          <div>
                            <span className="font-bold text-[#1A1A1A] block">{m.name}</span>
                            <span className="text-[10px] text-[#5871A5]">
                              {m.city || ''}, {m.state || ''} • Match: {m.matchReason}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            onClick={() => {
                              setLeadForm({
                                ...leadForm,
                                organisation_mode: 'existing',
                                organisation_id: m.id,
                              });
                            }}
                          >
                            Link This Account
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Select
                  label="Select Existing Account *"
                  required
                  value={leadForm.organisation_id}
                  onChange={(e) => setLeadForm({ ...leadForm, organisation_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Organisation' },
                    ...customers.map((c) => ({ value: c.id, label: `${c.name} (${c.city || 'Delhi'})` })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* Primary Contact Person */}
          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-3">
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider block">
              Key Contact Person
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Officer Name"
                value={leadForm.contact_name}
                onChange={(e) => setLeadForm({ ...leadForm, contact_name: e.target.value })}
                placeholder="e.g. Col. Alok Mathur"
              />
              <Input
                label="Designation / Rank"
                value={leadForm.contact_designation}
                onChange={(e) => setLeadForm({ ...leadForm, contact_designation: e.target.value })}
                placeholder="e.g. DIG Procurement"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Mobile / Direct Line"
                value={leadForm.contact_mobile}
                onChange={(e) => setLeadForm({ ...leadForm, contact_mobile: e.target.value })}
                placeholder="+91 98110 00000"
              />
              <Input
                label="Email Address"
                value={leadForm.contact_email}
                onChange={(e) => setLeadForm({ ...leadForm, contact_email: e.target.value })}
                placeholder="officer@crpf.gov.in"
              />
            </div>
          </div>

          {/* Opportunity Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Assigned Salesperson"
              value={leadForm.assigned_to}
              onChange={(e) => setLeadForm({ ...leadForm, assigned_to: e.target.value })}
              options={[
                { value: '', label: 'Current User' },
                ...usersList.map((u) => ({ value: u.id, label: `${u.full_name} (${u.role})` })),
              ]}
            />
            <Select
              label="Regional Manager"
              value={leadForm.regional_manager_id}
              onChange={(e) => setLeadForm({ ...leadForm, regional_manager_id: e.target.value })}
              options={[
                { value: '', label: 'None' },
                ...usersList.filter((u) => u.role === 'regional_manager' || u.role === 'management').map((u) => ({ value: u.id, label: u.full_name })),
              ]}
            />
            <Select
              label="Lead Source"
              value={leadForm.source}
              onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
              options={[
                { value: 'field_visit', label: 'Field Visit' },
                { value: 'referral', label: 'Referral' },
                { value: 'tender', label: 'Tender' },
                { value: 'exhibition', label: 'Exhibition' },
                { value: 'website', label: 'Website' },
                { value: 'cold_outreach', label: 'Cold Outreach' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Estimated Deal Value (₹ Lakh)"
              type="number"
              step="0.1"
              value={leadForm.value_lakh}
              onChange={(e) => setLeadForm({ ...leadForm, value_lakh: e.target.value })}
              placeholder="e.g. 45.0"
            />
            <Select
              label="Primary Product Interest"
              value={leadForm.product_ids[0] || ''}
              onChange={(e) => setLeadForm({ ...leadForm, product_ids: e.target.value ? [e.target.value] : [] })}
              options={[
                { value: '', label: 'None' },
                ...productsList.map((p) => ({ value: p.id, label: `${p.name} (${p.category || 'Defence'})` })),
              ]}
            />
          </div>

          <Textarea
            label="Initial Discussion Remarks"
            value={leadForm.remarks}
            onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
            placeholder="Preliminary requirements, procurement calendar, target deadlines..."
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Create Opportunity
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: LEAD DETAILS & LIFECYCLE PROGRESSION STEPPER                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLeadDetailOpen}
        onClose={() => setIsLeadDetailOpen(false)}
        title={selectedLead?.title || 'Opportunity Intelligence'}
        description={`Account: ${selectedLead?.organisation_name || 'Government Body'}`}
        maxWidth="4xl"
      >
        {selectedLead && (
          <div className="space-y-6 text-xs">
            {/* Meta Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Current Stage</span>
                <div className="mt-1">{getStatusBadge(selectedLead.lead_status || selectedLead.status)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Classification</span>
                <div className="mt-1">
                  {selectedLead.lead_type === 're_approached' ? (
                    <Badge variant="warning" size="sm">RE-APPROACHED</Badge>
                  ) : (
                    <Badge variant="info" size="sm">FRESH ACCOUNT</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Estimated Deal</span>
                <span className="font-extrabold text-[#223FA7] mt-1 block text-sm">
                  {formatLakh(selectedLead.value_lakh || selectedLead.estimated_value_lakh || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Current Sales Owner</span>
                <span className="font-bold text-gray-800 mt-1 block">
                  {selectedLead.assigned_salesperson_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Allowed Lifecycle Transitions Stepper */}
            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-[#223FA7]" />
                  <span>Lifecycle Stage Transitions</span>
                </span>
                <span className="text-[10px] text-[#5871A5]">
                  Validated by LeadWorkflowService state machine
                </span>
              </div>

              {selectedLead.allowed_transitions && selectedLead.allowed_transitions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedLead.allowed_transitions.map((nextSt: string) => (
                    <Button
                      key={nextSt}
                      size="xs"
                      variant={nextSt === 'converted' ? 'success' : nextSt === 'lost' ? 'danger' : 'outline'}
                      onClick={() => {
                        setTargetStatus(nextSt);
                        setIsStatusModalOpen(true);
                      }}
                    >
                      Advance to: {nextSt.toUpperCase()}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[#5871A5] italic">
                  This lead is in terminal stage ({selectedLead.lead_status?.toUpperCase()}). No further transitions allowed.
                </div>
              )}
            </div>

            {/* Product Interests Section */}
            <div className="p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-[#223FA7]" />
                  <span>Product Interests</span>
                </span>
                {productsList.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAddProductInterest(e.target.value);
                      e.target.value = '';
                    }}
                    className="px-2 py-1 text-[11px] bg-white border border-[#D6E3F5] rounded-lg text-[#1A1A1A]"
                  >
                    <option value="">+ Add Product Interest</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedLead.product_interests && selectedLead.product_interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLead.product_interests.map((p: any) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D6E3F5] text-xs font-medium text-[#1A1A1A]"
                    >
                      <span>{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductInterest(p.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-[#5871A5] italic">No products attached yet.</span>
              )}
            </div>

            {/* Salesperson Assignment History Audit */}
            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#223FA7]" />
                  <span>Salesperson Ownership Audit History</span>
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setNewSalespersonId(selectedLead.assigned_to || '');
                    setReassignReason('');
                    setIsReassignModalOpen(true);
                  }}
                >
                  Reassign Lead
                </Button>
              </div>

              {selectedLead.assignment_history && selectedLead.assignment_history.length > 0 ? (
                <div className="space-y-2">
                  {selectedLead.assignment_history.map((h: any) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#D6E3F5] flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-[#1A1A1A]">
                          {h.previous_salesperson_name || 'Unassigned'} → {h.new_salesperson_name}
                        </span>
                        {h.reason && (
                          <span className="text-[#5871A5] block mt-0.5">Reason: {h.reason}</span>
                        )}
                      </div>
                      <div className="text-right text-[#5871A5] font-mono text-[10px]">
                        By {h.changed_by_name || 'Admin'} • {new Date(h.changed_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-[#5871A5] italic">
                  Initial assignment active. No salesperson reassignments recorded.
                </span>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D6E3F5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLeadDetailOpen(false);
                  handleOpenCustomer360(selectedLead.organisation_id);
                }}
                leftIcon={<Building className="h-4 w-4" />}
              >
                Open 360° Account View
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInteractionForm({
                      ...interactionForm,
                      lead_id: selectedLead.id,
                      organisation_id: selectedLead.organisation_id,
                      contact_id: selectedLead.primary_contact_id || '',
                    });
                    setIsLogInteractionOpen(true);
                  }}
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                >
                  Log Touchpoint
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsLeadDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ADVANCE STATUS & LOSS REASON CAPTURE                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Advance Opportunity Status: ${targetStatus.toUpperCase()}`}
        description="Transitions are verified against Arihant BOS state machine rules."
        maxWidth="md"
      >
        <form onSubmit={handleStatusChange} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          {targetStatus === 'lost' && (
            <div className="space-y-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="font-bold text-red-900 block text-xs">
                Mandatory Win/Loss Analysis Reason:
              </span>
              <Select
                label="Loss Reason *"
                required
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                options={[
                  { value: 'price', label: 'Price / Commercial Disadvantage' },
                  { value: 'competitor', label: 'Competitor Selected (L1 / GeM preference)' },
                  { value: 'no_response', label: 'No Response / Client Silent' },
                  { value: 'not_interested', label: 'Client Not Interested' },
                  { value: 'eligibility', label: 'Technical Eligibility / Spec Mismatch' },
                  { value: 'timing', label: 'Budget Deferred / Timing Cancelled' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Textarea
                label="Loss Remarks & Debrief Notes"
                value={lossRemarks}
                onChange={(e) => setLossRemarks(e.target.value)}
                placeholder="Details of competitor bid, price difference, or specification requirements..."
              />
            </div>
          )}

          <p className="text-gray-600">
            Confirm advancing this opportunity from{' '}
            <strong className="text-[#1A1A1A]">{selectedLead?.lead_status?.toUpperCase()}</strong> to{' '}
            <strong className="text-[#223FA7]">{targetStatus.toUpperCase()}</strong>.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={targetStatus === 'lost' ? 'danger' : 'primary'}
              isLoading={actionLoading}
            >
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: REASSIGN SALESPERSON & LOG REASON                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reassign Opportunity Ownership"
        description="Transfers the lead to a new salesperson and immutably records the reassignment in audit history."
        maxWidth="md"
      >
        <form onSubmit={handleReassign} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <Select
            label="New Salesperson *"
            required
            value={newSalespersonId}
            onChange={(e) => setNewSalespersonId(e.target.value)}
            options={[
              { value: '', label: 'Select Salesperson' },
              ...usersList.map((u) => ({ value: u.id, label: `${u.full_name} (${u.role})` })),
            ]}
          />

          <Input
            label="Reassignment Reason"
            value={reassignReason}
            onChange={(e) => setReassignReason(e.target.value)}
            placeholder="e.g. Territory reorganization / officer transferred to Delhi HQ"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsReassignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Reassign & Dispatch Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: LOG FIELD INTERACTION & AUTO FOLLOW-UP SCHEDULER                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLogInteractionOpen}
        onClose={() => setIsLogInteractionOpen(false)}
        title="Log Client Interaction & Field Minutes"
        description="Records phone calls, physical meetings, technical presentations, and dispatches outbox events."
        maxWidth="lg"
      >
        <form onSubmit={handleLogInteraction} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Interaction Channel *"
              value={interactionForm.type}
              onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
              options={[
                { value: 'call', label: 'Phone Call' },
                { value: 'physical_visit', label: 'Face-to-Face Visit' },
                { value: 'demo', label: 'Demonstration / Trial' },
                { value: 'proposal', label: 'Proposal Submission' },
                { value: 'whatsapp', label: 'WhatsApp Message' },
                { value: 'email', label: 'Email Correspondence' },
                { value: 'tender_discussion', label: 'Pre-Tender Discussion' },
                { value: 'follow_up', label: 'Routine Follow-up' },
                { value: 'service_discussion', label: 'Service / Warranty Review' },
              ]}
            />
            <Input
              label="Interaction Date *"
              type="date"
              required
              value={interactionForm.date}
              onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
            />
          </div>

          <Textarea
            label="Minutes / Discussion Notes *"
            required
            value={interactionForm.notes}
            onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
            placeholder="Key discussion points, specifications requested, procurement timing, decision maker feedback..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Client Outcome / Feedback"
              value={interactionForm.outcome}
              onChange={(e) => setInteractionForm({ ...interactionForm, outcome: e.target.value })}
              placeholder="e.g. Approved technical trial"
            />
            <Input
              label="Next Action Step"
              value={interactionForm.next_action}
              onChange={(e) => setInteractionForm({ ...interactionForm, next_action: e.target.value })}
              placeholder="e.g. Send formal quote & compliance"
            />
          </div>

          {/* Follow-up scheduler */}
          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
            <Input
              label="Schedule Next Touchpoint Due Date (Auto-creates Follow-up)"
              type="date"
              value={interactionForm.next_followup_date}
              onChange={(e) => setInteractionForm({ ...interactionForm, next_followup_date: e.target.value })}
            />
          </div>

          {/* Supporting Document Attachment */}
          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-2">
            <span className="font-bold text-[#1A1A1A] block text-[11px] flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-[#5871A5]" />
              <span>Attach Supporting Document (Proposal / MOM)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Document Name"
                value={interactionForm.attachment_title}
                onChange={(e) => setInteractionForm({ ...interactionForm, attachment_title: e.target.value })}
                placeholder="e.g. RAF_MOM_Signed.pdf"
              />
              <Input
                label="File URL / Storage Link"
                value={interactionForm.attachment_url}
                onChange={(e) => setInteractionForm({ ...interactionForm, attachment_url: e.target.value })}
                placeholder="https://storage.arihant.com/docs/..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogInteractionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Save Touchpoint
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: CUSTOMER 360° ACCOUNT INTELLIGENCE DRAWER                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCustomer360Open}
        onClose={() => setIsCustomer360Open(false)}
        title={selectedCustomer?.name || 'Customer 360° Account View'}
        description={`${selectedCustomer?.city || 'Delhi'}, ${selectedCustomer?.state || 'Delhi'} • Sector: ${selectedCustomer?.sector || 'Defence'}`}
        maxWidth="4xl"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            {/* Account Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Account Sector</span>
                <span className="font-semibold text-[#1A1A1A] mt-1 block">
                  {selectedCustomer.sector || 'Government'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Zone / Region</span>
                <span className="font-semibold text-[#1A1A1A] mt-1 block">
                  {selectedCustomer.zone_name || 'North'} ({selectedCustomer.region_name || 'Delhi'})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Active Opportunities</span>
                <span className="font-extrabold text-[#223FA7] mt-1 block">
                  {customerLeads.length} Deals
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Total Interactions</span>
                <span className="font-bold text-gray-800 mt-1 block">
                  {customerTimeline.length} Touchpoints
                </span>
              </div>
            </div>

            {/* Contacts Roster */}
            <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
              <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#223FA7]" />
                <span>Account Contacts Roster</span>
              </span>
              {customerContacts.length === 0 ? (
                <span className="text-[11px] text-[#5871A5] italic">No contacts registered.</span>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customerContacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#D6E3F5] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A1A1A]">{c.name}</span>
                        {c.is_primary && (
                          <Badge variant="info" size="sm" className="text-[9px]">PRIMARY</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5871A5]">{c.designation || 'Officer'}</div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-600 font-mono">
                        {c.phone && <span>📞 {c.phone}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronological 360° Interaction Timeline */}
            <div className="p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-[#223FA7]" />
                  <span>Chronological Account Interaction Timeline</span>
                </span>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => {
                    setInteractionForm({
                      ...interactionForm,
                      lead_id: customerLeads[0]?.id || '',
                      organisation_id: selectedCustomer.id,
                      contact_id: customerContacts[0]?.id || '',
                    });
                    setIsLogInteractionOpen(true);
                  }}
                  leftIcon={<Plus className="h-3 w-3" />}
                >
                  Log Discussion
                </Button>
              </div>

              {customerTimelineLoading ? (
                <div className="p-6 text-center text-[#5871A5]">Loading account timeline...</div>
              ) : customerTimeline.length === 0 ? (
                <div className="p-6 rounded-lg bg-white border border-[#D6E3F5] text-center text-[#5871A5]">
                  No interactions recorded yet. Click "Log Discussion" to add minutes.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerTimeline.map((it) => (
                    <div
                      key={it.id}
                      className="p-3.5 rounded-xl bg-white border border-[#D6E3F5] space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm" className="uppercase font-bold text-[10px]">
                            {it.type}
                          </Badge>
                          <span className="text-[11px] text-[#5871A5] font-mono">
                            {new Date(it.interaction_date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#5871A5] font-medium">
                          By {it.created_by_name || 'Executive'}
                        </span>
                      </div>

                      <p className="text-gray-800 text-xs leading-relaxed font-sans">{it.notes}</p>

                      {it.next_action && (
                        <div className="flex items-center gap-2 text-[11px] text-[#223FA7] font-medium pt-1">
                          <Clock className="h-3 w-3 text-[#5871A5]" />
                          <span>Next Action: {it.next_action}</span>
                          {it.next_action_date && (
                            <span className="text-[#5871A5] font-mono">
                              (Target: {new Date(it.next_action_date).toLocaleDateString('en-IN')})
                            </span>
                          )}
                        </div>
                      )}

                      {it.attachments && it.attachments.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {it.attachments.map((att: any) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#D6E3F5] text-[10px] text-[#223FA7] hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              <span>{att.file_name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#D6E3F5]">
              <Button variant="ghost" size="sm" onClick={() => setIsCustomer360Open(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: COMPLETE FOLLOW-UP & OPTIONAL CONTINUATION SCHEDULER             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCompleteFollowupOpen}
        onClose={() => setIsCompleteFollowupOpen(false)}
        title="Complete Follow-up Touchpoint"
        description="Records outcome remarks and optionally schedules the subsequent pipeline reminder."
        maxWidth="md"
      >
        <form onSubmit={handleCompleteFollowup} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <Input
            label="Touchpoint Outcome"
            value={completionOutcome}
            onChange={(e) => setCompletionOutcome(e.target.value)}
            placeholder="e.g. Officer agreed to physical demonstration on 28th"
          />

          <Textarea
            label="Remarks / Minutes"
            value={completionRemarks}
            onChange={(e) => setCompletionRemarks(e.target.value)}
            placeholder="Details of client discussion..."
          />

          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNextFollowup}
                onChange={(e) => setScheduleNextFollowup(e.target.checked)}
                className="rounded border-[#D6E3F5] text-[#223FA7] focus:ring-[#223FA7]"
              />
              <span className="font-semibold text-gray-800 text-xs">
                Schedule next follow-up touchpoint
              </span>
            </label>

            {scheduleNextFollowup && (
              <Input
                label="Next Follow-up Due Date *"
                type="date"
                required={scheduleNextFollowup}
                value={nextFollowupDueDate}
                onChange={(e) => setNextFollowupDueDate(e.target.value)}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCompleteFollowupOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" isLoading={actionLoading}>
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 8: RESCHEDULE FOLLOW-UP                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRescheduleFollowupOpen}
        onClose={() => setIsRescheduleFollowupOpen(false)}
        title="Reschedule Follow-up Touchpoint"
        description="Updates the reminder due date for this sales activity."
        maxWidth="sm"
      >
        <form onSubmit={handleRescheduleFollowup} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {formError}
            </div>
          )}

          <Input
            label="New Due Date *"
            type="date"
            required
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
          />

          <Input
            label="Reschedule Remarks"
            value={rescheduleRemarks}
            onChange={(e) => setRescheduleRemarks(e.target.value)}
            placeholder="e.g. Officer on leave until next Monday"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6E3F5]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsRescheduleFollowupOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Reschedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
