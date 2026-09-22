'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Filter,
  Eye,
  ShieldCheck,
  Award,
  AlertCircle,
  ArrowRight,
  History,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  BarChart3,
  Layers,
  RefreshCw,
  Send,
  Flag,
  FileCheck,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  FilterBar,
  Modal,
  StatCard,
  StatGrid,
  EmptyState,
  InfoCallout,
} from '@/components/ui';
import { formatINR } from '@arihant/shared';

// Lifecycle states and display labels
const STAGES = [
  { key: 'identified', label: 'Identified', color: 'default' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', color: 'warning' },
  { key: 'rejected_internally', label: 'Rejected Internally', color: 'danger' },
  { key: 'under_preparation', label: 'Under Preparation', color: 'info' },
  { key: 'pq_submitted', label: 'PQ Submitted', color: 'info' },
  { key: 'pq_qualified', label: 'PQ Qualified', color: 'success' },
  { key: 'submitted', label: 'Tender Submitted', color: 'info' },
  { key: 'technical_eval', label: 'Technical Evaluation', color: 'cyber' },
  { key: 'commercial_eval', label: 'Commercial Evaluation', color: 'cyber' },
  { key: 'won', label: 'Won', color: 'success' },
  { key: 'lost', label: 'Lost', color: 'danger' },
  { key: 'cancelled', label: 'Cancelled', color: 'default' },
  { key: 'on_hold', label: 'On Hold', color: 'warning' },
] as const;

export default function TendersPage() {
  const { user, hasRole } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Master lists
  const [tenders, setTenders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);

  // Master Lookups
  const [categories, setCategories] = useState<any[]>([]);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Executive Dashboard Stats (14 Metrics + Win Rate %)
  const [dashboardStats, setDashboardStats] = useState<any>({
    total: 0,
    pq_count: 0,
    general_mha_count: 0,
    other_count: 0,
    under_preparation: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    pending: 0,
    pending_approvals: 0,
    upcoming_deadlines: 0,
    urgent_deadlines: 0,
    overdue: 0,
    result_followups: 0,
    open_portal_issues: 0,
    win_rate_percentage: 0,
  });

  // Filter Bar state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [sortBy, setSortBy] = useState('submission_deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeHudFilter, setActiveHudFilter] = useState<string | null>(null);

  // Detail Modal & Sub-panels
  const [selectedTender, setSelectedTender] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'approval' | 'transitions' | 'portal_issues' | 'outcome' | 'timeline'>('overview');
  const [activities, setActivities] = useState<any[]>([]);
  const [portalIssues, setPortalIssues] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Action Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  // Create Form State
  const [newTender, setNewTender] = useState({
    tender_no: '',
    portal: 'GeM',
    organisation_id: '',
    department: '',
    product_id: '',
    city: '',
    state: '',
    zone: 'North',
    region: 'Delhi NCR',
    category: 'general_mha',
    requirement_text: '',
    quantity: 1,
    emd_fee: 0,
    estimated_value_lakh: '',
    publication_date: new Date().toISOString().split('T')[0],
    submission_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assigned_person_id: '',
    remarks: '',
  });

  // Approval Form State
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected'>('approved');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Outcome Form State
  const [outcomeResult, setOutcomeResult] = useState<'won' | 'lost'>('won');
  const [outcomeValueLakh, setOutcomeValueLakh] = useState('');
  const [outcomeLossReason, setOutcomeLossReason] = useState('price');
  const [outcomeCompetitor, setOutcomeCompetitor] = useState('');
  const [outcomeRemarks, setOutcomeRemarks] = useState('');
  const [outcomeResultDate, setOutcomeResultDate] = useState(new Date().toISOString().split('T')[0]);

  // Transition Form State
  const [targetTransitionStatus, setTargetTransitionStatus] = useState('');
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [transitionSubmissionDate, setTransitionSubmissionDate] = useState(new Date().toISOString().split('T')[0]);

  // Portal Issue Form State
  const [newIssueText, setNewIssueText] = useState('');
  const [issueResponsiblePerson, setIssueResponsiblePerson] = useState('');
  const [issueEscalatedTo, setIssueEscalatedTo] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Lookups
  const fetchMasters = async () => {
    try {
      const [catsRes, orgsRes, prodsRes, usersRes] = await Promise.all([
        api.get('/tenders/categories').catch(() => []),
        api.get('/organisations', { limit: 100 }).catch(() => ({ data: [] })),
        api.get('/products').catch(() => []),
        api.get('/users', { limit: 100 }).catch(() => ({ data: [] })),
      ]);

      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setOrganisations(orgsRes.data || []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : prodsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  // 2. Fetch Executive Dashboard Metrics
  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/tenders/dashboard');
      if (res) {
        setDashboardStats(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  // 3. Fetch Tenders List (Server-side Search & Pagination)
  const fetchTenders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (zoneFilter) params.zone = zoneFilter;
      if (deadlineFilter) params.deadline = deadlineFilter;

      const res = await api.get('/tenders', params);
      setTenders(res.data || []);
      setTotalCount(res.total || 0);

      // Auto-open highlight if specified in URL query
      if (highlightId && res.data) {
        const found = res.data.find((t: any) => t.id === highlightId);
        if (found) {
          openTenderDetails(found);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter, zoneFilter, deadlineFilter, sortBy, sortOrder, highlightId]);

  // Initial load
  useEffect(() => {
    fetchMasters();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  // Real-time Event-Driven Synchronization via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTenderRealtimeEvent = () => {
      fetchTenders();
      fetchDashboardStats();
    };

    socket.on('tender:created', handleTenderRealtimeEvent);
    socket.on('tender:updated', handleTenderRealtimeEvent);
    socket.on('tender:status_changed', handleTenderRealtimeEvent);
    socket.on('tender:approved', handleTenderRealtimeEvent);
    socket.on('tender:won', handleTenderRealtimeEvent);
    socket.on('tender:lost', handleTenderRealtimeEvent);
    socket.on('tender:portal_issue_created', handleTenderRealtimeEvent);
    socket.on('tender:portal_issue_resolved', handleTenderRealtimeEvent);

    return () => {
      socket.off('tender:created', handleTenderRealtimeEvent);
      socket.off('tender:updated', handleTenderRealtimeEvent);
      socket.off('tender:status_changed', handleTenderRealtimeEvent);
      socket.off('tender:approved', handleTenderRealtimeEvent);
      socket.off('tender:won', handleTenderRealtimeEvent);
      socket.off('tender:lost', handleTenderRealtimeEvent);
      socket.off('tender:portal_issue_created', handleTenderRealtimeEvent);
      socket.off('tender:portal_issue_resolved', handleTenderRealtimeEvent);
    };
  }, [fetchTenders]);

  // Open Tender Detail & Fetch History & Portal Issues
  const openTenderDetails = async (tender: any) => {
    setSelectedTender(tender);
    setIsDetailOpen(true);
    setDetailTab('overview');
    setIsLoadingDetails(true);
    try {
      const [fullTender, actRes, issuesRes] = await Promise.all([
        api.get(`/tenders/${tender.id}`).catch(() => tender),
        api.get(`/tenders/${tender.id}/activities`).catch(() => []),
        api.get(`/tenders/${tender.id}/portal-issues`).catch(() => []),
      ]);
      setSelectedTender(fullTender);
      setActivities(Array.isArray(actRes) ? actRes : []);
      setPortalIssues(Array.isArray(issuesRes) ? issuesRes : []);
    } catch (err) {
      console.error('Failed to load tender details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Quick HUD card filter handler
  const handleHudClick = (filterType: string, val: string) => {
    if (activeHudFilter === filterType) {
      // Clear filter
      setActiveHudFilter(null);
      setStatusFilter('');
      setCategoryFilter('');
      setDeadlineFilter('');
    } else {
      setActiveHudFilter(filterType);
      if (filterType === 'pq') {
        setCategoryFilter('pq');
        setStatusFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'general_mha') {
        setCategoryFilter('general_mha');
        setStatusFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'awaiting_approval') {
        setStatusFilter('awaiting_approval');
        setCategoryFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'under_preparation') {
        setStatusFilter('under_preparation');
        setCategoryFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'submitted') {
        setStatusFilter('submitted');
        setCategoryFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'won') {
        setStatusFilter('won');
        setCategoryFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'lost') {
        setStatusFilter('lost');
        setCategoryFilter('');
        setDeadlineFilter('');
      } else if (filterType === 'urgent_deadlines') {
        setDeadlineFilter('urgent_48h');
        setStatusFilter('');
        setCategoryFilter('');
      } else if (filterType === 'upcoming_deadlines') {
        setDeadlineFilter('upcoming_7d');
        setStatusFilter('');
        setCategoryFilter('');
      } else if (filterType === 'overdue') {
        setDeadlineFilter('overdue');
        setStatusFilter('');
        setCategoryFilter('');
      }
    }
    setPage(1);
  };

  // 4. Handle Create Tender
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    // Validate deadline >= pubDate
    if (newTender.publication_date && newTender.submission_deadline) {
      if (new Date(newTender.submission_deadline) < new Date(newTender.publication_date)) {
        setActionError('Submission deadline cannot be earlier than publication date.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/tenders', {
        tender_number: newTender.tender_no.trim(),
        portal: newTender.portal,
        organisation_id: newTender.organisation_id || undefined,
        department: newTender.department.trim(),
        product_id: newTender.product_id || undefined,
        city: newTender.city.trim(),
        state: newTender.state.trim(),
        zone: newTender.zone,
        region: newTender.region,
        category: newTender.category,
        requirement_text: newTender.requirement_text.trim(),
        quantity: Number(newTender.quantity) || 1,
        emd_fee: Number(newTender.emd_fee) || 0,
        estimated_value_lakh: newTender.estimated_value_lakh ? Number(newTender.estimated_value_lakh) : undefined,
        publication_date: newTender.publication_date,
        submission_deadline: newTender.submission_deadline,
        assigned_person_id: newTender.assigned_person_id || undefined,
        remarks: newTender.remarks.trim() || undefined,
      });

      setIsCreateOpen(false);
      setNewTender({
        tender_no: '',
        portal: 'GeM',
        organisation_id: '',
        department: '',
        product_id: '',
        city: '',
        state: '',
        zone: 'North',
        region: 'Delhi NCR',
        category: 'general_mha',
        requirement_text: '',
        quantity: 1,
        emd_fee: 0,
        estimated_value_lakh: '',
        publication_date: new Date().toISOString().split('T')[0],
        submission_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_person_id: '',
        remarks: '',
      });

      await Promise.all([fetchTenders(), fetchDashboardStats()]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to register tender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Approval Submit (Independent Dual-Control Signoff)
  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;
    setActionError(null);

    if (approvalDecision === 'rejected' && !rejectionReason.trim()) {
      setActionError('A valid rejection reason is mandatory when declining participation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/tenders/${selectedTender.id}/approve`, {
        decision: approvalDecision,
        remarks: approvalRemarks,
        rejection_reason: approvalDecision === 'rejected' ? rejectionReason : undefined,
      });

      setIsApproveOpen(false);
      setApprovalRemarks('');
      setRejectionReason('');
      await openTenderDetails(selectedTender);
      await Promise.all([fetchTenders(), fetchDashboardStats()]);
    } catch (err: any) {
      setActionError(err.message || 'Approval action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Workflow Transitions
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender || !targetTransitionStatus) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/tenders/${selectedTender.id}/transitions`, {
        target_status: targetTransitionStatus,
        remarks: transitionRemarks,
        submission_date: targetTransitionStatus === 'submitted' ? transitionSubmissionDate : undefined,
      });

      setIsTransitionOpen(false);
      setTargetTransitionStatus('');
      setTransitionRemarks('');
      await openTenderDetails(selectedTender);
      await Promise.all([fetchTenders(), fetchDashboardStats()]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to transition tender stage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handle Win / Loss Outcome Submit
  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;
    setActionError(null);

    if (outcomeResult === 'lost' && !outcomeLossReason) {
      setActionError('Structured loss reason is mandatory for loss analysis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/tenders/${selectedTender.id}/outcome`, {
        result: outcomeResult,
        value_lakh: outcomeResult === 'won' && outcomeValueLakh ? Number(outcomeValueLakh) : undefined,
        reason: outcomeRemarks || (outcomeResult === 'lost' ? outcomeLossReason : 'Won commercial evaluation'),
        loss_reason: outcomeResult === 'lost' ? outcomeLossReason : undefined,
        competitor: outcomeCompetitor.trim() || undefined,
        result_date: outcomeResultDate,
      });

      setIsOutcomeOpen(false);
      setOutcomeRemarks('');
      setOutcomeCompetitor('');
      setOutcomeValueLakh('');
      await openTenderDetails(selectedTender);
      await Promise.all([fetchTenders(), fetchDashboardStats()]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record tender outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Handle Create Portal Issue
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender || !newIssueText.trim()) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/tenders/${selectedTender.id}/portal-issues`, {
        issue: newIssueText.trim(),
        responsible_person: issueResponsiblePerson.trim() || undefined,
        escalated_to: issueEscalatedTo.trim() || undefined,
      });

      setIsNewIssueOpen(false);
      setNewIssueText('');
      setIssueResponsiblePerson('');
      setIssueEscalatedTo('');
      await openTenderDetails(selectedTender);
      await fetchDashboardStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to log portal issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9. Handle Escalate / Resolve Portal Issue
  const handleUpdateIssueStatus = async (issueId: string, status: string, resolution?: string) => {
    if (!selectedTender) return;
    try {
      await api.patch(`/tenders/${selectedTender.id}/portal-issues/${issueId}`, {
        resolution_status: status,
        resolution: resolution || undefined,
        escalated_to: status === 'escalated' ? 'Executive Management & GeM Desk' : undefined,
      });
      await openTenderDetails(selectedTender);
      await fetchDashboardStats();
    } catch (err: any) {
      console.error('Failed to update portal issue:', err);
    }
  };

  // Allowed transitions helper based on current stage
  const getAllowedTransitions = (status: string, category: string) => {
    const isPq = category?.toLowerCase().includes('pq');
    switch (status) {
      case 'identified':
        return [{ status: 'awaiting_approval', label: 'Submit for Internal Approval' }];
      case 'awaiting_approval':
        return [
          { status: 'under_preparation', label: 'Approve & Start Preparation' },
          { status: 'rejected_internally', label: 'Reject Participation' },
        ];
      case 'under_preparation':
        if (isPq) {
          return [
            { status: 'pq_submitted', label: 'Submit Pre-Qualification (PQ)' },
            { status: 'submitted', label: 'Submit Bid Directly' },
            { status: 'on_hold', label: 'Put On Hold' },
            { status: 'cancelled', label: 'Cancel Tender' },
          ];
        }
        return [
          { status: 'submitted', label: 'Submit Tender Bid' },
          { status: 'on_hold', label: 'Put On Hold' },
          { status: 'cancelled', label: 'Cancel Tender' },
        ];
      case 'pq_submitted':
        return [
          { status: 'pq_qualified', label: 'Mark PQ Qualified' },
          { status: 'lost', label: 'Mark PQ Disqualified / Lost' },
        ];
      case 'pq_qualified':
        return [
          { status: 'submitted', label: 'Submit Commercial & Technical Envelopes' },
          { status: 'under_preparation', label: 'Back to Preparation' },
        ];
      case 'submitted':
        return [
          { status: 'technical_eval', label: 'Enter Technical Evaluation' },
          { status: 'commercial_eval', label: 'Enter Commercial Evaluation' },
          { status: 'won', label: 'Mark Bid as Won' },
          { status: 'lost', label: 'Mark Bid as Lost' },
        ];
      case 'technical_eval':
        return [
          { status: 'commercial_eval', label: 'Advance to Commercial Evaluation' },
          { status: 'lost', label: 'Disqualified in Technical Evaluation' },
        ];
      case 'commercial_eval':
        return [
          { status: 'won', label: 'Declare L1 & Won' },
          { status: 'lost', label: 'Declare L2/Lost' },
        ];
      case 'on_hold':
        return [
          { status: 'under_preparation', label: 'Resume Preparation' },
          { status: 'cancelled', label: 'Cancel Tender' },
        ];
      default:
        return [];
    }
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Tender Pipeline & Bids Command"
        description="Government bidding pipeline, GeM/CPPP portal issue tracking, dual-control signoffs, and win/loss analytics."
        icon={<FileText className="h-6 w-6 text-[#223FA7]" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchTenders();
                fetchDashboardStats();
              }}
              leftIcon={<RefreshCw className="h-3.5 w-3.5 text-[#5871A5]" />}
            >
              <span>Refresh</span>
            </Button>
            {hasRole(['management', 'regional_manager', 'tender_team', 'admin']) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setIsCreateOpen(true);
                }}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                <span>Register New Tender</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Executive Metrics HUD (14 Metrics + Win Rate %) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Executive Pipeline Metrics"
            description="Real-time multi-dimensional aggregation across all procurement stages"
          />
          {dashboardStats.win_rate_percentage !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#D6E3F5] shadow-2xs">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-[#5871A5]">Overall Win Rate:</span>
              <span className="text-sm font-black text-emerald-700">
                {Number(dashboardStats.win_rate_percentage || 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Primary Row: 5 Core Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Tenders"
            value={dashboardStats.total || 0}
            subtext="All tracked opportunities"
            icon={<FileText className="h-4 w-4 text-[#223FA7]" />}
            className="cursor-pointer hover:border-[#223FA7]"
            onClick={() => handleHudClick('total', '')}
          />

          <StatCard
            label="PQ Tenders"
            value={dashboardStats.pq_count || 0}
            subtext="Pre-qualification bids"
            icon={<Layers className="h-4 w-4 text-[#223FA7]" />}
            valueColor="primary"
            className={`cursor-pointer ${categoryFilter === 'pq' ? 'ring-2 ring-[#223FA7]' : ''}`}
            onClick={() => handleHudClick('pq', 'pq')}
          />

          <StatCard
            label="General / MHA"
            value={dashboardStats.general_mha_count || 0}
            subtext="Defence & Ministry bids"
            icon={<Building className="h-4 w-4 text-[#223FA7]" />}
            className={`cursor-pointer ${categoryFilter === 'general_mha' ? 'ring-2 ring-[#223FA7]' : ''}`}
            onClick={() => handleHudClick('general_mha', 'general_mha')}
          />

          <StatCard
            label="Under Preparation"
            value={dashboardStats.under_preparation || 0}
            subtext="In active bid drafting"
            icon={<Clock className="h-4 w-4 text-[#5871A5]" />}
            className={`cursor-pointer ${statusFilter === 'under_preparation' ? 'ring-2 ring-[#223FA7]' : ''}`}
            onClick={() => handleHudClick('under_preparation', 'under_preparation')}
          />

          <StatCard
            label="Pending Approvals"
            value={dashboardStats.pending_approvals || 0}
            subtext="Awaiting executive signoff"
            icon={<ShieldCheck className="h-4 w-4 text-amber-600" />}
            valueColor="amber"
            badge={
              dashboardStats.pending_approvals > 0 ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              ) : null
            }
            className={`cursor-pointer ${statusFilter === 'awaiting_approval' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => handleHudClick('awaiting_approval', 'awaiting_approval')}
          />
        </div>

        {/* Secondary Row: Submissions, Results & Deadlines */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard
            label="Submitted Bids"
            value={dashboardStats.submitted || 0}
            subtext="Awaiting eval/results"
            icon={<Send className="h-4 w-4 text-[#223FA7]" />}
            className={`cursor-pointer ${statusFilter === 'submitted' ? 'ring-2 ring-[#223FA7]' : ''}`}
            onClick={() => handleHudClick('submitted', 'submitted')}
          />

          <StatCard
            label="Won Tenders"
            value={dashboardStats.won || 0}
            subtext="L1 awards achieved"
            icon={<Award className="h-4 w-4 text-emerald-600" />}
            valueColor="emerald"
            className={`cursor-pointer ${statusFilter === 'won' ? 'ring-2 ring-emerald-600' : ''}`}
            onClick={() => handleHudClick('won', 'won')}
          />

          <StatCard
            label="Lost Tenders"
            value={dashboardStats.lost || 0}
            subtext="Competitor / QR loss"
            icon={<XCircle className="h-4 w-4 text-red-600" />}
            valueColor="rose"
            className={`cursor-pointer ${statusFilter === 'lost' ? 'ring-2 ring-red-600' : ''}`}
            onClick={() => handleHudClick('lost', 'lost')}
          />

          <StatCard
            label="Urgent (≤ 48h)"
            value={dashboardStats.urgent_deadlines || 0}
            subtext="Imminent closing date"
            icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            valueColor="amber"
            className={`cursor-pointer ${deadlineFilter === 'urgent_48h' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => handleHudClick('urgent_deadlines', 'urgent_48h')}
          />

          <StatCard
            label="Upcoming (≤ 7d)"
            value={dashboardStats.upcoming_deadlines || 0}
            subtext="Due within one week"
            icon={<Calendar className="h-4 w-4 text-blue-600" />}
            className={`cursor-pointer ${deadlineFilter === 'upcoming_7d' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleHudClick('upcoming_deadlines', 'upcoming_7d')}
          />

          <StatCard
            label="Portal Issues"
            value={dashboardStats.open_portal_issues || 0}
            subtext="GeM glitches logged"
            icon={<Flag className="h-4 w-4 text-amber-600" />}
            valueColor={dashboardStats.open_portal_issues > 0 ? 'amber' : 'default'}
          />
        </div>
      </div>

      {/* 3. Filter Bar */}
      <FilterBar>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#5871A5] z-10" />
            <Input
              type="text"
              placeholder="Search tender no, department, requirement, city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setActiveHudFilter(null);
              setPage(1);
            }}
            className="h-10"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.code} value={c.code}>
                {c.name || c.code.toUpperCase()}
              </option>
            ))}
          </Select>

          {/* Stage / Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setActiveHudFilter(null);
              setPage(1);
            }}
            className="h-10"
          >
            <option value="">All Lifecycle Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>

          {/* Deadline Filter */}
          <Select
            value={deadlineFilter}
            onChange={(e) => {
              setDeadlineFilter(e.target.value);
              setActiveHudFilter(null);
              setPage(1);
            }}
            className="h-10"
          >
            <option value="">All Deadlines</option>
            <option value="due_today">Due Today</option>
            <option value="urgent_48h">Urgent (≤ 48 Hours)</option>
            <option value="upcoming_7d">Upcoming (≤ 7 Days)</option>
            <option value="overdue">Overdue Bids</option>
          </Select>

          {/* Zone Filter */}
          <div className="flex items-center gap-2">
            <Select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 flex-1"
            >
              <option value="">All Zones</option>
              <option value="North">North Zone</option>
              <option value="South">South Zone</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
              <option value="Central">Central Zone</option>
            </Select>

            {(search || statusFilter || categoryFilter || zoneFilter || deadlineFilter || activeHudFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  setZoneFilter('');
                  setDeadlineFilter('');
                  setActiveHudFilter(null);
                  setPage(1);
                }}
                className="text-xs text-[#5871A5] hover:text-[#1A1A1A] shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </FilterBar>

      {/* 4. Tender Register Table */}
      <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
              <tr>
                <th className="p-3.5">Tender Reference No.</th>
                <th className="p-3.5">Department / Location</th>
                <th className="p-3.5">Equipment Requirement</th>
                <th className="p-3.5">EMD / Est. Value</th>
                <th className="p-3.5">Submission Deadline</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E3F5]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-[#5871A5]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#223FA7]" />
                      <span>Loading tender opportunities...</span>
                    </div>
                  </td>
                </tr>
              ) : tenders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-[#5871A5]">
                    <EmptyState
                      icon={<FileText className="h-8 w-8 text-[#5871A5]" />}
                      title="No tenders match the specified criteria"
                      description="Try clearing search filters or add a new tender to the pipeline."
                      action={
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('');
                            setCategoryFilter('');
                            setDeadlineFilter('');
                            setZoneFilter('');
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                tenders.map((tender) => {
                  const closingDate = tender.submission_deadline
                    ? new Date(tender.submission_deadline)
                    : null;
                  const today = new Date();
                  const diffHours = closingDate
                    ? (closingDate.getTime() - today.getTime()) / (1000 * 60 * 60)
                    : 9999;
                  const diffDays = Math.ceil(diffHours / 24);

                  const isCompleted = ['won', 'lost', 'cancelled'].includes(tender.status);
                  const isOverdue = !isCompleted && diffHours < 0;
                  const isUrgent = !isCompleted && diffHours >= 0 && diffHours <= 48;
                  const isUpcoming = !isCompleted && diffHours > 48 && diffDays <= 7;

                  const stageObj = STAGES.find((s) => s.key === tender.status) || {
                    label: tender.status.replace(/_/g, ' ').toUpperCase(),
                    color: 'default' as const,
                  };

                  return (
                    <tr
                      key={tender.id}
                      className={`transition-colors hover:bg-[#F7FBFF] ${
                        isOverdue
                          ? 'bg-red-50/20'
                          : isUrgent
                          ? 'bg-amber-50/25'
                          : isUpcoming
                          ? 'bg-blue-50/15'
                          : ''
                      }`}
                    >
                      {/* Tender ID & Portal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#223FA7] hover:underline cursor-pointer" onClick={() => openTenderDetails(tender)}>
                            {tender.tender_number}
                          </span>
                          {isUrgent && (
                            <span className="flex h-2 w-2 relative" title="Urgent deadline: ≤ 48 hours remaining">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                          {isOverdue && (
                            <span className="flex h-2 w-2 relative" title="Overdue: Submission deadline passed">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EAF2FF] text-[#223FA7]">
                            {tender.portal || 'GeM'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#5871A5]">
                            {tender.category || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Buyer Department & Location */}
                      <td className="p-3.5 max-w-[200px] truncate">
                        <div className="font-semibold text-[#1A1A1A] truncate" title={tender.department || tender.organisation_name}>
                          {tender.department || tender.organisation_name || 'Government Buyer'}
                        </div>
                        <div className="text-[10px] text-[#5871A5] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {tender.city}, {tender.state}
                          </span>
                          {tender.zone && (
                            <span className="px-1 rounded bg-slate-100 text-[9px] font-medium text-slate-600">
                              {tender.zone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Requirement Excerpt & Ownership */}
                      <td className="p-3.5 max-w-[240px] truncate">
                        <div className="truncate font-medium text-[#1A1A1A]" title={tender.requirement_text}>
                          {tender.requirement_text}
                        </div>
                        <div className="text-[10px] text-[#5871A5] truncate mt-0.5 flex items-center gap-1">
                          <User className="h-2.5 w-2.5 shrink-0" />
                          <span>Owner: {tender.owner_name || tender.assigned_person_name || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Qty & EMD / Value */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#1A1A1A]">
                          Qty: {tender.quantity || 1}
                        </div>
                        <div className="text-[10px] text-[#5871A5] font-mono mt-0.5">
                          {tender.estimated_value_lakh
                            ? `₹ ${tender.estimated_value_lakh} Lakh`
                            : tender.emd_fee
                            ? `EMD: ${formatINR(tender.emd_fee)}`
                            : 'EMD: Exempt'}
                        </div>
                      </td>

                      {/* Submission Deadline */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono text-gray-800 font-semibold">
                          {closingDate ? closingDate.toLocaleDateString('en-IN') : 'TBA'}
                        </div>
                        {isOverdue ? (
                          <Badge variant="danger" size="sm" className="mt-1">
                            OVERDUE
                          </Badge>
                        ) : isUrgent ? (
                          <Badge variant="urgent" size="sm" className="mt-1">
                            {diffHours <= 24 ? 'CLOSING TODAY' : `${Math.ceil(diffHours)}H LEFT`}
                          </Badge>
                        ) : isUpcoming ? (
                          <Badge variant="info" size="sm" className="mt-1">
                            {diffDays} DAYS LEFT
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-[#5871A5]">Standard</span>
                        )}
                      </td>

                      {/* Current Stage */}
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge variant={stageObj.color} size="sm">
                          {stageObj.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openTenderDetails(tender)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-[#223FA7]" />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#F7FBFF] border-t border-[#D6E3F5] flex items-center justify-between text-xs text-[#5871A5]">
          <div>
            Showing <strong className="text-[#1A1A1A]">{tenders.length}</strong> of{' '}
            <strong className="text-[#1A1A1A]">{totalCount}</strong> tender opportunities
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="font-medium text-[#1A1A1A]">
              Page {page} of {Math.max(1, Math.ceil(totalCount / limit))}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= Math.ceil(totalCount / limit)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Comprehensive Tender Detail Drawer / Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedTender?.tender_number || 'Tender Specifications'}
        description={`Portal: ${selectedTender?.portal || 'GeM'} • Buyer: ${selectedTender?.department || selectedTender?.organisation_name || 'Government Department'}`}
        maxWidth="4xl"
      >
        {selectedTender && (
          <div className="space-y-6 text-xs">
            {/* Stage Progress Stepper */}
            <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#5871A5] uppercase tracking-wider">
                  Lifecycle Progress
                </span>
                <Badge
                  variant={
                    selectedTender.status === 'won'
                      ? 'success'
                      : selectedTender.status === 'lost' || selectedTender.status === 'rejected_internally'
                      ? 'danger'
                      : 'info'
                  }
                  size="sm"
                >
                  {selectedTender.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Visual State Tracker */}
              <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-semibold">
                <div className={`p-1.5 rounded ${['identified', 'awaiting_approval', 'under_preparation', 'pq_submitted', 'pq_qualified', 'submitted', 'technical_eval', 'commercial_eval', 'won', 'lost'].includes(selectedTender.status) ? 'bg-[#223FA7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  1. Identified
                </div>
                <div className={`p-1.5 rounded ${['awaiting_approval', 'under_preparation', 'pq_submitted', 'pq_qualified', 'submitted', 'technical_eval', 'commercial_eval', 'won', 'lost'].includes(selectedTender.status) ? 'bg-[#223FA7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  2. Approval
                </div>
                <div className={`p-1.5 rounded ${['under_preparation', 'pq_submitted', 'pq_qualified', 'submitted', 'technical_eval', 'commercial_eval', 'won', 'lost'].includes(selectedTender.status) ? 'bg-[#223FA7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  3. Preparation
                </div>
                <div className={`p-1.5 rounded ${['pq_submitted', 'pq_qualified', 'submitted', 'technical_eval', 'commercial_eval', 'won', 'lost'].includes(selectedTender.status) ? 'bg-[#223FA7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  4. PQ Phase
                </div>
                <div className={`p-1.5 rounded ${['submitted', 'technical_eval', 'commercial_eval', 'won', 'lost'].includes(selectedTender.status) ? 'bg-[#223FA7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  5. Submitted
                </div>
                <div className={`p-1.5 rounded ${['won', 'lost'].includes(selectedTender.status) ? (selectedTender.status === 'won' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-200 text-slate-500'}`}>
                  6. Outcome
                </div>
              </div>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center gap-1 border-b border-[#D6E3F5] pb-2">
              <Button
                size="xs"
                variant={detailTab === 'overview' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('overview')}
              >
                Overview & Specs
              </Button>
              <Button
                size="xs"
                variant={detailTab === 'approval' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('approval')}
              >
                Approval Signoff
              </Button>
              <Button
                size="xs"
                variant={detailTab === 'transitions' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('transitions')}
              >
                Advance Stage
              </Button>
              <Button
                size="xs"
                variant={detailTab === 'portal_issues' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('portal_issues')}
              >
                Portal Issues ({portalIssues.length})
              </Button>
              <Button
                size="xs"
                variant={detailTab === 'outcome' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('outcome')}
              >
                Win / Loss Verdict
              </Button>
              <Button
                size="xs"
                variant={detailTab === 'timeline' ? 'primary' : 'ghost'}
                onClick={() => setDetailTab('timeline')}
              >
                Audit Timeline ({activities.length})
              </Button>
            </div>

            {/* TAB 1: Overview & Specs */}
            {detailTab === 'overview' && (
              <div className="space-y-4">
                {/* Urgent Deadline banner */}
                {selectedTender.submission_deadline && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#223FA7]" />
                      <span className="font-semibold text-blue-900">Submission Deadline:</span>
                      <span className="font-mono text-blue-800">
                        {new Date(selectedTender.submission_deadline).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {selectedTender.publication_date && (
                      <div className="text-[11px] text-[#5871A5]">
                        Published: {new Date(selectedTender.publication_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                )}

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-[#1A1A1A] uppercase">{selectedTender.category}</span>
                  </div>
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Quantity</span>
                    <span className="font-semibold text-[#1A1A1A]">{selectedTender.quantity} Units</span>
                  </div>
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">EMD Fee</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedTender.emd_fee ? formatINR(selectedTender.emd_fee) : 'Nil / Exempt'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Territory / Zone</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedTender.zone || 'North'} &bull; {selectedTender.region || 'Delhi NCR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Assigned Owner</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedTender.owner_name || selectedTender.assigned_person_name || 'Self'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Est. Value (Lakh)</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedTender.estimated_value_lakh ? `₹ ${selectedTender.estimated_value_lakh} Lakh` : 'Not Specified'}
                    </span>
                  </div>
                </div>

                {/* Requirement text */}
                <div>
                  <h4 className="font-bold text-[#1A1A1A] mb-1.5 uppercase text-[11px]">
                    Technical Requirement & Scope
                  </h4>
                  <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-[#1A1A1A] leading-relaxed text-xs">
                    {selectedTender.requirement_text || 'No technical requirement text provided.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Dual-Control Approval Signoff */}
            {detailTab === 'approval' && (
              <div className="space-y-4">
                <SectionHeader
                  title="Dual-Control Participation Signoff"
                  description="Ensures independent executive review before committing capital or bid bonds"
                />

                {selectedTender.internal_approval_by ? (
                  <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedTender.status === 'rejected_internally' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        )}
                        <span className="font-bold text-sm text-[#1A1A1A]">
                          Decision:{' '}
                          {selectedTender.status === 'rejected_internally'
                            ? 'REJECTED INTERNALLY'
                            : 'APPROVED TO PARTICIPATE'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5871A5]">
                        {selectedTender.internal_approval_at
                          ? new Date(selectedTender.internal_approval_at).toLocaleString('en-IN')
                          : ''}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700">
                      Endorsed by Approver ID: <strong className="font-mono">{selectedTender.internal_approval_by}</strong>
                    </div>

                    {selectedTender.remarks && (
                      <div className="p-2.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-gray-800">
                        <strong>Directive / Remarks:</strong> {selectedTender.remarks}
                      </div>
                    )}
                  </div>
                ) : selectedTender.status === 'awaiting_approval' ? (
                  <div className="space-y-3">
                    {/* Non-self-approval rule */}
                    {user?.id === selectedTender.tender_owner_id ? (
                      <InfoCallout
                        variant="warning"
                        title="Independent Review Required"
                      >
                        Dual-Control Policy: You are registered as the tender owner/creator. An independent Regional Manager or Executive Management member must review and approve this tender.
                      </InfoCallout>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
                        <div className="text-xs text-[#5871A5]">
                          This tender requires management clearance to proceed with bid preparation and EMD allocation.
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setApprovalDecision('approved');
                              setIsApproveOpen(true);
                            }}
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            Approve Participation
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setApprovalDecision('rejected');
                              setIsApproveOpen(true);
                            }}
                            leftIcon={<XCircle className="h-4 w-4" />}
                          >
                            Reject Participation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-[#D6E3F5] text-center text-xs text-[#5871A5]">
                    This tender is currently in the <strong>{selectedTender.status.replace(/_/g, ' ')}</strong> stage.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Workflow State Machine Transitions */}
            {detailTab === 'transitions' && (
              <div className="space-y-4">
                <SectionHeader
                  title="Stage Advancement State Machine"
                  description="Enforces authorized transitions to maintain data integrity"
                />

                <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
                  <div className="text-xs text-[#5871A5]">
                    Current Stage:{' '}
                    <Badge variant="info" size="sm">
                      {selectedTender.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#1A1A1A] block">
                      Permitted Next Actions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {getAllowedTransitions(selectedTender.status, selectedTender.category).length === 0 ? (
                        <span className="text-xs text-[#5871A5]">
                          No further automatic transitions available from this terminal state.
                        </span>
                      ) : (
                        getAllowedTransitions(selectedTender.status, selectedTender.category).map((tr) => (
                          <Button
                            key={tr.status}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTargetTransitionStatus(tr.status);
                              setIsTransitionOpen(true);
                            }}
                            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          >
                            {tr.label}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: External Portal Issues Tracker */}
            {detailTab === 'portal_issues' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    title="GeM / External Portal Issues"
                    description="Internal tracker for portal glitches, category errors, or OEM auth upload bugs"
                  />
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => {
                      setActionError(null);
                      setIsNewIssueOpen(true);
                    }}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Log Portal Issue
                  </Button>
                </div>

                {portalIssues.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-[#D6E3F5] text-center text-xs text-[#5871A5]">
                    No external portal issues currently recorded for this tender.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {portalIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3.5 rounded-xl bg-white border border-[#D6E3F5] space-y-2 hover:border-[#9FC0F5] transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-[#1A1A1A] block">
                              {issue.issue}
                            </span>
                            <span className="text-[10px] text-[#5871A5]">
                              Reported on {new Date(issue.reported_date || issue.created_at).toLocaleDateString('en-IN')} by {issue.reporter_name || 'Tender Team'}
                            </span>
                          </div>
                          <Badge
                            variant={
                              issue.resolution_status === 'resolved' || issue.resolution_status === 'closed'
                                ? 'success'
                                : issue.resolution_status === 'escalated'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {issue.resolution_status.toUpperCase()}
                          </Badge>
                        </div>

                        {issue.escalated_to && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Escalated to:</strong> {issue.escalated_to}
                          </div>
                        )}

                        {issue.resolution && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                            <strong>Resolution:</strong> {issue.resolution}
                          </div>
                        )}

                        {issue.resolution_status !== 'resolved' && issue.resolution_status !== 'closed' && (
                          <div className="flex items-center gap-2 pt-1">
                            {issue.resolution_status !== 'escalated' && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleUpdateIssueStatus(issue.id, 'escalated')}
                              >
                                Escalate to Management
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => {
                                const res = prompt('Enter resolution description:');
                                if (res) handleUpdateIssueStatus(issue.id, 'resolved', res);
                              }}
                            >
                              Resolve Issue
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Win / Loss Outcome Verdict */}
            {detailTab === 'outcome' && (
              <div className="space-y-4">
                <SectionHeader
                  title="Final Commercial Outcome Analysis"
                  description="Structured post-bid intelligence for win rate calculation and loss pattern tracking"
                />

                {selectedTender.result ? (
                  <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedTender.result === 'won' ? (
                          <Award className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <span className="text-sm font-black uppercase text-[#1A1A1A]">
                            Final Result: {selectedTender.result}
                          </span>
                          <span className="text-[10px] text-[#5871A5] block">
                            Declared on {selectedTender.result_date ? new Date(selectedTender.result_date).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={selectedTender.result === 'won' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {selectedTender.result.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5]">
                      <div>
                        <span className="text-[10px] text-[#5871A5] uppercase font-bold block">
                          Contract Value
                        </span>
                        <span className="font-semibold text-xs text-[#1A1A1A]">
                          {selectedTender.value_lakh ? `₹ ${selectedTender.value_lakh} Lakh` : 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5871A5] uppercase font-bold block">
                          Winning Competitor
                        </span>
                        <span className="font-semibold text-xs text-[#1A1A1A]">
                          {selectedTender.competitor || 'Arihant (Direct Award)'}
                        </span>
                      </div>
                    </div>

                    {selectedTender.outcome_reason && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-[#D6E3F5] text-xs text-gray-800">
                        <strong>Reason / Analysis:</strong> {selectedTender.outcome_reason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] space-y-3 text-center">
                    <p className="text-xs text-[#5871A5]">
                      Outcome has not been recorded yet. You can mark this tender as Won or Lost once the buyer opens commercial bids.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsOutcomeOpen(true)}
                      leftIcon={<Award className="h-4 w-4" />}
                    >
                      Record Commercial Verdict (Won / Lost)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: Audit History & Activity Timeline */}
            {detailTab === 'timeline' && (
              <div className="space-y-3">
                <SectionHeader
                  title="Activity Audit Trail"
                  description="Complete audit trail of all state transitions and management interventions"
                />

                {activities.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-[#D6E3F5] text-center text-xs text-[#5871A5]">
                    No activity records found for this tender.
                  </div>
                ) : (
                  <div className="relative pl-4 border-l-2 border-[#D6E3F5] space-y-4 my-2">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#223FA7] border-2 border-white ring-2 ring-[#D6E3F5]" />
                        <div className="p-3 rounded-lg bg-white border border-[#D6E3F5] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#5871A5]">
                            <span className="font-bold text-[#223FA7] uppercase tracking-wider">
                              {act.event_type}
                            </span>
                            <span>{new Date(act.created_at).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-gray-800 font-medium">{act.description}</p>
                          {act.performer_name && (
                            <div className="text-[10px] text-[#5871A5] flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />
                              <span>Actor: {act.performer_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 6. Register New Tender Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Tender Opportunity"
        description="Add a tender requirement to the centralized operational pipeline with transactional event publishing."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tender / GeM Bid No."
              required
              value={newTender.tender_no}
              onChange={(e) => setNewTender({ ...newTender, tender_no: e.target.value })}
              placeholder="e.g. GEM/2026/B/88219"
            />
            <Select
              label="Tender Portal"
              value={newTender.portal}
              onChange={(e) => setNewTender({ ...newTender, portal: e.target.value })}
              options={[
                { value: 'GeM', label: 'Government e-Marketplace (GeM)' },
                { value: 'CPPP', label: 'Central Public Procurement Portal (CPPP)' },
                { value: 'State Portal', label: 'State Procurement Portal' },
                { value: 'Direct / Manual', label: 'Direct Ministry RFP' },
              ]}
            />
            <Select
              label="Classification Category"
              value={newTender.category}
              onChange={(e) => setNewTender({ ...newTender, category: e.target.value })}
              options={
                categories.length > 0
                  ? categories.map((c) => ({ value: c.code, label: c.name || c.code }))
                  : [
                      { value: 'general_mha', label: 'General / MHA' },
                      { value: 'pq', label: 'Pre-Qualification (PQ)' },
                      { value: 'other', label: 'Other Defence / Govt' },
                    ]
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Buyer Department / Ministry"
              required
              value={newTender.department}
              onChange={(e) => setNewTender({ ...newTender, department: e.target.value })}
              placeholder="e.g. Directorate General Border Security Force (BSF)"
            />
            <Select
              label="Mapped Organisation (Optional)"
              value={newTender.organisation_id}
              onChange={(e) => setNewTender({ ...newTender, organisation_id: e.target.value })}
            >
              <option value="">-- Direct Buyer / Unlinked --</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              label="City"
              required
              value={newTender.city}
              onChange={(e) => setNewTender({ ...newTender, city: e.target.value })}
              placeholder="e.g. New Delhi"
            />
            <Input
              label="State"
              required
              value={newTender.state}
              onChange={(e) => setNewTender({ ...newTender, state: e.target.value })}
              placeholder="e.g. Delhi"
            />
            <Select
              label="Territory Zone"
              value={newTender.zone}
              onChange={(e) => setNewTender({ ...newTender, zone: e.target.value })}
              options={[
                { value: 'North', label: 'North' },
                { value: 'South', label: 'South' },
                { value: 'East', label: 'East' },
                { value: 'West', label: 'West' },
                { value: 'Central', label: 'Central' },
              ]}
            />
            <Input
              label="Territory Region"
              value={newTender.region}
              onChange={(e) => setNewTender({ ...newTender, region: e.target.value })}
              placeholder="e.g. Delhi NCR"
            />
          </div>

          <Textarea
            label="Product Requirement & Scope"
            required
            rows={2}
            value={newTender.requirement_text}
            onChange={(e) => setNewTender({ ...newTender, requirement_text: e.target.value })}
            placeholder="e.g. Passive Night Vision Monoculars as per MHA Qualitative Requirements with Belgian Photonis Tubes"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={newTender.quantity}
              onChange={(e) => setNewTender({ ...newTender, quantity: Number(e.target.value) })}
            />
            <Input
              label="EMD Fee (₹)"
              type="number"
              min="0"
              value={newTender.emd_fee}
              onChange={(e) => setNewTender({ ...newTender, emd_fee: Number(e.target.value) })}
            />
            <Input
              label="Est. Value (₹ Lakh)"
              type="number"
              step="0.01"
              value={newTender.estimated_value_lakh}
              onChange={(e) => setNewTender({ ...newTender, estimated_value_lakh: e.target.value })}
              placeholder="e.g. 150.00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Publication Date"
              type="date"
              required
              value={newTender.publication_date}
              onChange={(e) => setNewTender({ ...newTender, publication_date: e.target.value })}
            />
            <Input
              label="Submission Deadline"
              type="date"
              required
              value={newTender.submission_deadline}
              onChange={(e) => setNewTender({ ...newTender, submission_deadline: e.target.value })}
            />
          </div>

          <Select
            label="Assign Tender Owner"
            value={newTender.assigned_person_id}
            onChange={(e) => setNewTender({ ...newTender, assigned_person_id: e.target.value })}
          >
            <option value="">-- Assign to Current User --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role?.replace(/_/g, ' ')})
              </option>
            ))}
          </Select>

          <Input
            label="Internal Notes / Remarks"
            value={newTender.remarks}
            onChange={(e) => setNewTender({ ...newTender, remarks: e.target.value })}
            placeholder="e.g. High priority. Sample demo already completed."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Register Tender Opportunity
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Dual-Control Approval Modal */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Executive Participation Decision"
        description="Verify financial commitments, EMD bond requirements and commercial capability before endorsing."
        maxWidth="md"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Select
            label="Endorsement Decision"
            value={approvalDecision}
            onChange={(e) => setApprovalDecision(e.target.value as any)}
            options={[
              { value: 'approved', label: 'APPROVE - Proceed with Bid Preparation' },
              { value: 'rejected', label: 'REJECT - Drop Tender (Do Not Participate)' },
            ]}
          />

          {approvalDecision === 'rejected' && (
            <Select
              label="Mandatory Rejection Reason"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              options={[
                { value: '', label: '-- Select Reason --' },
                { value: 'Insufficient eligibility', label: 'Insufficient eligibility (Turnover / Experience QR)' },
                { value: 'Commercial concern', label: 'Commercial concern (Unviable margin or high penalty)' },
                { value: 'Documentation unavailable', label: 'Documentation unavailable (OEM Authorization missing)' },
                { value: 'Management decision', label: 'Management decision' },
                { value: 'Other', label: 'Other operational reason' },
              ]}
            />
          )}

          <Input
            label="Directives / Remarks"
            value={approvalRemarks}
            onChange={(e) => setApprovalRemarks(e.target.value)}
            placeholder="e.g. Approved with Belgian OEM authorization. Ensure 2% margin."
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Commit Endorsement
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Stage Transition Modal */}
      <Modal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        title="Advance Tender Lifecycle Stage"
        description={`Transition from ${selectedTender?.status} to ${targetTransitionStatus}`}
        maxWidth="md"
      >
        <form onSubmit={handleTransitionSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          {targetTransitionStatus === 'submitted' && (
            <Input
              label="Portal Submission Date"
              type="date"
              required
              value={transitionSubmissionDate}
              onChange={(e) => setTransitionSubmissionDate(e.target.value)}
            />
          )}

          <Input
            label="Transition Notes / Remarks"
            value={transitionRemarks}
            onChange={(e) => setTransitionRemarks(e.target.value)}
            placeholder="e.g. Technical documents successfully submitted on GeM portal."
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsTransitionOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Confirm Stage Advancement
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Final Outcome (Won / Lost) Modal */}
      <Modal
        isOpen={isOutcomeOpen}
        onClose={() => setIsOutcomeOpen(false)}
        title="Record Final Commercial Verdict"
        description="Capture commercial result for win/loss analytics and post-bid intelligence."
        maxWidth="md"
      >
        <form onSubmit={handleOutcomeSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Select
            label="Final Result"
            value={outcomeResult}
            onChange={(e) => setOutcomeResult(e.target.value as any)}
            options={[
              { value: 'won', label: 'WON - Order Awarded to Arihant (Ranked L1)' },
              { value: 'lost', label: 'LOST - Awarded to Competitor or Disqualified' },
            ]}
          />

          <Input
            label="Result Declaration Date"
            type="date"
            required
            value={outcomeResultDate}
            onChange={(e) => setOutcomeResultDate(e.target.value)}
          />

          {outcomeResult === 'won' ? (
            <Input
              label="Final Contract Award Value (₹ Lakh)"
              type="number"
              step="0.01"
              value={outcomeValueLakh}
              onChange={(e) => setOutcomeValueLakh(e.target.value)}
              placeholder="e.g. 145.50"
            />
          ) : (
            <div className="space-y-3">
              <Select
                label="Structured Loss Reason"
                required
                value={outcomeLossReason}
                onChange={(e) => setOutcomeLossReason(e.target.value)}
                options={[
                  { value: 'price', label: 'Price (Competitor underquoted L1)' },
                  { value: 'competitor', label: 'Competitor advantage' },
                  { value: 'technical', label: 'Technical rejection' },
                  { value: 'eligibility', label: 'Eligibility / Past experience shortfall' },
                  { value: 'documentation', label: 'Documentation / Tender error' },
                  { value: 'customer_decision', label: 'Customer cancellation / retender' },
                  { value: 'other', label: 'Other reason' },
                ]}
              />

              <Input
                label="Winning Competitor (Optional)"
                value={outcomeCompetitor}
                onChange={(e) => setOutcomeCompetitor(e.target.value)}
                placeholder="e.g. Falcon Security / BEL / MKU"
              />
            </div>
          )}

          <Input
            label="Outcome Intelligence Remarks"
            value={outcomeRemarks}
            onChange={(e) => setOutcomeRemarks(e.target.value)}
            placeholder="e.g. Quoted ₹ 14.2 Lakh vs competitor ₹ 13.9 Lakh"
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOutcomeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Commercial Verdict
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. Log External Portal Issue Modal */}
      <Modal
        isOpen={isNewIssueOpen}
        onClose={() => setIsNewIssueOpen(false)}
        title="Report GeM / External Portal Issue"
        description="Document an internal issue with the external tender portal for escalation and resolution tracking."
        maxWidth="md"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Textarea
            label="Issue Description"
            required
            rows={3}
            value={newIssueText}
            onChange={(e) => setNewIssueText(e.target.value)}
            placeholder="e.g. Required equipment category does not appear on GeM portal dropdown."
          />

          <Input
            label="Responsible Person / Team"
            value={issueResponsiblePerson}
            onChange={(e) => setIssueResponsiblePerson(e.target.value)}
            placeholder="e.g. Tender Team / Rahul"
          />

          <Input
            label="Escalation Target (Optional)"
            value={issueEscalatedTo}
            onChange={(e) => setIssueEscalatedTo(e.target.value)}
            placeholder="e.g. Executive Management & GeM Desk Ticket #88412"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewIssueOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Log Issue
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
