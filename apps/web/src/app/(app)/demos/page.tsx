'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Plus,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  Users,
  Search,
  Filter,
  RefreshCw,
  Building,
  Layers,
  Wrench,
  BarChart3,
  History,
  Plane,
  ChevronRight,
  Info,
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Button,
  Badge,
  Card,
  Modal,
  Input,
  Select,
  PageContainer,
  PageHeader,
  StatCard,
  StatGrid,
  SectionHeader,
  FilterBar,
  EmptyState,
  InfoCallout,
  Tabs,
  Checkbox,
} from '@/components/ui';

export default function DemosPage() {
  const { user, hasRole } = useAuth();

  // Primary active tab
  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'coordinator' | 'fleet' | 'analytics' | 'history'
  >('pipeline');

  // Core Data States
  const [demos, setDemos] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [customerHistoryDemos, setCustomerHistoryDemos] = useState<any[]>([]);
  const [selectedHistoryOrgId, setSelectedHistoryOrgId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Pipeline tab
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Live Equipment Availability Checker State
  const [availFilterProduct, setAvailFilterProduct] = useState('');
  const [availFilterLocation, setAvailFilterLocation] = useState('');
  const [availFilterDate, setAvailFilterDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [availabilityResults, setAvailabilityResults] = useState<any | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Selected Demo for actions & detail
  const [selectedDemo, setSelectedDemo] = useState<any | null>(null);
  const [selectedDemoAudit, setSelectedDemoAudit] = useState<any | null>(null);

  // Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
  const [isReserveEquipOpen, setIsReserveEquipOpen] = useState(false);
  const [isConfirmDateOpen, setIsConfirmDateOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  // Submitting / Error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Create Demo Request Form
  const [newDemo, setNewDemo] = useState({
    organisation_id: '',
    product_id: '',
    location: '',
    requested_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    purpose: '',
    expected_audience: '',
    equipment_required: '',
    special_requirements: '',
    remarks: '',
    visit_id: '',
    travel_required: false,
    travel_from: 'Delhi Depot',
    travel_to: '',
    travel_date: '',
    travel_remarks: '',
  });

  // 2. Assign Team Form
  const [teamForm, setTeamForm] = useState({
    assigned_to: '',
    confirmed_date: '',
    travel_required: false,
    travel_from: '',
    travel_to: '',
    travel_date: '',
    travel_remarks: '',
    remarks: '',
  });

  // 3. Equipment Reservation Form
  const [reserveForm, setReserveForm] = useState({
    equipment_id: '',
    reserved_from: '',
    reserved_to: '',
    remarks: '',
  });

  // 4. Confirm Date Form
  const [confirmForm, setConfirmForm] = useState({
    confirmed_date: '',
    remarks: '',
  });

  // 5. Reschedule Form
  const [rescheduleForm, setRescheduleForm] = useState({
    new_date: '',
    reason: '',
  });

  // 6. Cancel Form
  const [cancelForm, setCancelForm] = useState({
    cancellation_reason: 'customer_cancelled',
    remarks: '',
  });

  // 7. Outcome & Structured Failure Analysis Form
  const [outcomeForm, setOutcomeForm] = useState({
    completed: true,
    result: 'success' as 'success' | 'fail' | 'partial',
    failure_reason: 'TECHNICAL_FAILURE',
    customer_response: 'Positive feedback; demonstrated operational readiness',
    technical_performance: 'Optimal performance across all test targets',
    product_suitability: 'Suitable for procurement tender specifications',
    decision_maker_present: true,
    competitor_involved: '',
    next_step: 'Commercial quotation & GeM bid submission',
    opportunity_stage: 'Proposal',
    remarks: 'Demonstration successfully witnessed by procurement committee.',
  });

  // 8. Add / Edit Equipment Form
  const [equipmentForm, setEquipmentForm] = useState({
    id: '',
    product_id: '',
    model: '',
    serial_no: '',
    current_location: 'Delhi',
    condition: 'Operational',
    remarks: '',
  });

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const fetchDemosData = async () => {
    try {
      setIsLoading(true);
      setActionError(null);

      const [
        demosRes,
        equipRes,
        orgsRes,
        productsRes,
        analyticsRes,
      ] = await Promise.all([
        api.get('/demos', { limit: 100 }),
        api.get('/demos/equipment'),
        api.get('/organisations', { limit: 100 }),
        api.get('/masters/products'),
        api.get('/demos/analytics').catch(() => null),
      ]);

      setDemos(demosRes.data || []);
      setEquipmentList(equipRes || []);
      setOrganisations(orgsRes.data || orgsRes || []);
      setProducts(productsRes || []);
      if (analyticsRes) setAnalyticsData(analyticsRes);
    } catch (err: any) {
      console.error('Failed to load demo data:', err);
      setActionError(err.message || 'Failed to load demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemosData();
  }, []);

  // Fetch Team availability whenever team modal opens or date changes
  const loadTeamAvailability = async (targetDate: string) => {
    try {
      const res = await api.get('/demos/team/availability', { date: targetDate });
      setTeamMembers(res || []);
    } catch (err) {
      console.error('Failed to load team availability:', err);
    }
  };

  // Run live availability check
  const runAvailabilityCheck = async () => {
    try {
      setIsCheckingAvailability(true);
      const res = await api.get('/demos/equipment/availability', {
        product_id: availFilterProduct || undefined,
        location: availFilterLocation || undefined,
        from_date: availFilterDate,
        to_date: availFilterDate,
      });
      setAvailabilityResults(res);
    } catch (err: any) {
      console.error('Availability check failed:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fleet') {
      runAvailabilityCheck();
    }
  }, [availFilterProduct, availFilterLocation, availFilterDate, activeTab]);

  // Handle customer history load
  const loadCustomerHistory = async (orgId: string) => {
    setSelectedHistoryOrgId(orgId);
    if (!orgId) {
      setCustomerHistoryDemos([]);
      return;
    }
    try {
      const res = await api.get('/demos', { organisation_id: orgId, limit: 50 });
      setCustomerHistoryDemos(res.data || []);
    } catch (err) {
      console.error('Failed to load customer history:', err);
    }
  };

  // Filtered Demos for pipeline
  const filteredDemos = useMemo(() => {
    return demos.filter((demo) => {
      if (filterStatus && demo.status !== filterStatus) return false;
      if (filterProduct && demo.product_id !== filterProduct) return false;
      if (filterLocation && !demo.location?.toLowerCase().includes(filterLocation.toLowerCase())) {
        return false;
      }
      if (filterDateFrom) {
        const d = demo.confirmed_date || demo.requested_date;
        if (d && d < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const d = demo.confirmed_date || demo.requested_date;
        if (d && d > filterDateTo) return false;
      }
      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        const match =
          demo.demo_no?.toLowerCase().includes(s) ||
          demo.organisation_name?.toLowerCase().includes(s) ||
          demo.product_name?.toLowerCase().includes(s) ||
          demo.location?.toLowerCase().includes(s) ||
          demo.requested_by_name?.toLowerCase().includes(s) ||
          demo.assignee_name?.toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [
    demos,
    filterStatus,
    filterProduct,
    filterLocation,
    filterDateFrom,
    filterDateTo,
    filterSearch,
  ]);

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    try {
      const created = await api.post('/demos', newDemo);
      setActionSuccess(`Demo request ${created.demo_no} created successfully.`);
      setIsCreateOpen(false);
      setNewDemo({
        organisation_id: '',
        product_id: '',
        location: '',
        requested_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        purpose: '',
        expected_audience: '',
        equipment_required: '',
        special_requirements: '',
        remarks: '',
        visit_id: '',
        travel_required: false,
        travel_from: 'Delhi Depot',
        travel_to: '',
        travel_date: '',
        travel_remarks: '',
      });
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create demo request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAssignTeam = async (demo: any) => {
    setSelectedDemo(demo);
    const date = demo.confirmed_date || demo.requested_date;
    setTeamForm({
      assigned_to: demo.assigned_to || '',
      confirmed_date: demo.confirmed_date || demo.requested_date || '',
      travel_required: demo.travel_required || false,
      travel_from: demo.travel_from || 'Delhi HQ',
      travel_to: demo.travel_to || demo.location || '',
      travel_date: demo.travel_date || demo.confirmed_date || demo.requested_date || '',
      travel_remarks: demo.travel_remarks || '',
      remarks: demo.remarks || '',
    });
    await loadTeamAvailability(date);
    setIsAssignTeamOpen(true);
  };

  const handleAssignTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/assign-team`, teamForm);
      setActionSuccess(`Demo team member assigned to ${selectedDemo.demo_no}.`);
      setIsAssignTeamOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReserve = (demo: any) => {
    setSelectedDemo(demo);
    const date = demo.confirmed_date || demo.requested_date || new Date().toISOString().split('T')[0];
    setReserveForm({
      equipment_id: '',
      reserved_from: date,
      reserved_to: date,
      remarks: '',
    });
    setIsReserveEquipOpen(true);
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post(`/demos/${selectedDemo.id}/reserve`, reserveForm);
      if (res.location_mismatch) {
        setActionSuccess(
          `Demo Unit Reserved! NOTE: Equipment is located in ${res.equipment_location}, while Demo is in ${res.demo_location}. Depot transit planning recorded.`,
        );
      } else {
        setActionSuccess(`Equipment unit reserved for ${selectedDemo.demo_no}.`);
      }
      setIsReserveEquipOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reserve equipment unit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/confirm`, confirmForm);
      setActionSuccess(`Demonstration date confirmed for ${selectedDemo.demo_no}.`);
      setIsConfirmDateOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm date.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/reschedule`, rescheduleForm);
      setActionSuccess(`Demo ${selectedDemo.demo_no} rescheduled to ${rescheduleForm.new_date}.`);
      setIsRescheduleOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/cancel`, cancelForm);
      setActionSuccess(`Demo ${selectedDemo.demo_no} cancelled. Equipment & team reservations released.`);
      setIsCancelOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenOutcome = (demo: any) => {
    setSelectedDemo(demo);
    setOutcomeForm({
      completed: true,
      result: 'success',
      failure_reason: 'TECHNICAL_FAILURE',
      customer_response: 'Customer appreciated live sensitivity and false-alarm rejection',
      technical_performance: 'Zero misfires during comprehensive field trial',
      product_suitability: 'Met all DGQA & MHA security trial parameters',
      decision_maker_present: true,
      competitor_involved: '',
      next_step: 'Commercial negotiation & tender participation',
      opportunity_stage: 'Proposal',
      remarks: 'Signed trial certificate obtained from site commandant.',
    });
    setIsOutcomeOpen(true);
  };

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/outcome`, outcomeForm);
      setActionSuccess(`Demo ${selectedDemo.demo_no} marked completed and outcome logged.`);
      setIsOutcomeOpen(false);
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit demo outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAudit = async (demo: any) => {
    setSelectedDemo(demo);
    try {
      const res = await api.get(`/demos/${demo.id}/audit`);
      setSelectedDemoAudit(res);
      setIsAuditOpen(true);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      if (equipmentForm.id) {
        await api.patch(`/demos/equipment/${equipmentForm.id}`, equipmentForm);
        setActionSuccess(`Equipment unit ${equipmentForm.serial_no} updated.`);
      } else {
        await api.post('/demos/equipment', equipmentForm);
        setActionSuccess(`New equipment unit ${equipmentForm.serial_no} added to depot fleet.`);
      }
      setIsEquipmentModalOpen(false);
      await fetchDemosData();
      await runAvailabilityCheck();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save equipment unit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper status badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="warning">REQUESTED</Badge>;
      case 'under_planning':
        return <Badge variant="info">UNDER PLANNING</Badge>;
      case 'confirmed':
        return <Badge variant="cyber">CONFIRMED</Badge>;
      case 'equipment_reserved':
        return <Badge variant="info">EQUIPMENT RESERVED</Badge>;
      case 'team_assigned':
        return <Badge variant="info">TEAM ASSIGNED</Badge>;
      case 'completed':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'cancelled':
        return <Badge variant="danger">CANCELLED</Badge>;
      case 'rescheduled':
        return <Badge variant="outline">RESCHEDULED</Badge>;
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <PageContainer>
      {/* Top Banner & Header */}
      <PageHeader
        moduleBadge="Module 3"
        tagline="BOS-DEMO-SUITE"
        icon={<Sparkles className="h-7 w-7 text-[#223FA7]" />}
        title="Field Demonstrations & Trials Management"
        description="End-to-end management of client trial requests, multi-depot fleet availability, concurrency-safe reservations, date confirmation, failure analysis, and visit integration."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDemosData}
              isLoading={isLoading}
              className="flex items-center gap-1.5 border-[#D6E3F5] text-[#223FA7] hover:bg-[#EAF2FF]"
            >
              <RefreshCw className="h-4 w-4" />
              Sync
            </Button>

            {hasRole(['sales', 'regional_manager', 'demo_team', 'management', 'admin']) && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New Demo Request
              </Button>
            )}
          </>
        }
      />

      {/* Global Alerts / Feedback */}
      {actionSuccess && (
        <InfoCallout
          variant="success"
          title="Action Completed"
          onClose={() => setActionSuccess(null)}
        >
          {actionSuccess}
        </InfoCallout>
      )}

      {actionError && (
        <InfoCallout
          variant="danger"
          title="Operation Error"
          onClose={() => setActionError(null)}
        >
          {actionError}
        </InfoCallout>
      )}

      {/* Module 3 Primary Navigation Tabs */}
      <Tabs
        variant="pills"
        tabs={[
          {
            id: 'pipeline',
            label: 'Demo Pipeline & Requests',
            icon: <Layers className="h-4 w-4" />,
            count: demos.length,
          },
          {
            id: 'coordinator',
            label: 'Coordinator Planning Queue',
            icon: <Wrench className="h-4 w-4" />,
            count: demos.filter((d) => ['requested', 'under_planning'].includes(d.status)).length,
            badgeVariant: 'warning',
          },
          {
            id: 'fleet',
            label: 'Depot Fleet & Live Availability',
            icon: <Package className="h-4 w-4" />,
            count: equipmentList.length,
          },
          {
            id: 'analytics',
            label: 'Analytics & Failure Insights',
            icon: <BarChart3 className="h-4 w-4" />,
          },
          {
            id: 'history',
            label: 'Customer Trial History',
            icon: <History className="h-4 w-4" />,
          },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* =================================================================== */}
      {/* TAB 1: DEMO PIPELINE & REQUESTS                                    */}
      {/* =================================================================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <FilterBar>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#5871A5]" />
                <Input
                  placeholder="Search Demo ID, Client, Product, Assignee..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Requested', value: 'requested' },
                  { label: 'Under Planning', value: 'under_planning' },
                  { label: 'Team Assigned', value: 'team_assigned' },
                  { label: 'Equipment Reserved', value: 'equipment_reserved' },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Rescheduled', value: 'rescheduled' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
              />

              <Select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                options={[
                  { label: 'All Products', value: '' },
                  ...products.map((p) => ({ label: p.name, value: p.id })),
                ]}
              />

              <Input
                placeholder="Filter Location (Delhi/Patna...)"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  title="From Date"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterSearch('');
                    setFilterStatus('');
                    setFilterProduct('');
                    setFilterLocation('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="text-xs px-2"
                >
                  Reset
                </Button>
              </div>
            </div>
          </FilterBar>

          {/* Demos List / Cards */}
          {filteredDemos.length === 0 ? (
            <EmptyState
              icon={<Box className="h-6 w-6" />}
              title="No Demonstrations Found"
              description="No trial requests match the selected filters. Create a new demo request or adjust your search parameters."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
                  Create Demo Request
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDemos.map((demo) => (
                <Card
                  key={demo.id}
                  className="p-5 bg-white hover:border-[#9FC0F5] border border-[#D6E3F5] rounded-xl transition-all shadow-2xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D6E3F5] pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#223FA7] px-2.5 py-1 rounded bg-[#EAF2FF] border border-[#D6E3F5]">
                        {demo.demo_no}
                      </span>
                      <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#5871A5]" />
                        {demo.organisation_name}
                      </h3>
                      {renderStatusBadge(demo.status)}

                      {demo.visit_id && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                          title="Originating from planned customer field visit"
                        >
                          <MapPin className="h-3 w-3" />
                          VISIT LINKED
                        </span>
                      )}

                      {demo.travel_required && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Plane className="h-3 w-3" />
                          TRAVEL REQ.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#5871A5]">
                      <span>Version: {demo.version}</span>
                      <span>•</span>
                      <span>Logged: {new Date(demo.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4 text-sm">
                    <div>
                      <span className="text-xs text-[#5871A5] uppercase tracking-wider block font-semibold">
                        Equipment / Product
                      </span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5">
                        {demo.product_name || demo.equipment_required || 'Standard Security Suite'}
                      </p>
                      {demo.special_requirements && (
                        <p className="text-xs text-[#5871A5] mt-0.5 italic">
                          Req: {demo.special_requirements}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-[#5871A5] uppercase tracking-wider block font-semibold">
                        Location & Dates
                      </span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#5871A5]" />
                        {demo.location || demo.city || 'Depot HQ'}
                      </p>
                      <p className="text-xs text-[#5871A5] mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#5871A5]" />
                        {demo.confirmed_date ? (
                          <span className="text-emerald-700 font-bold">
                            Confirmed: {demo.confirmed_date}
                          </span>
                        ) : (
                          <span>Requested: {demo.requested_date || 'TBD'}</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-[#5871A5] uppercase tracking-wider block font-semibold">
                        Team & Logistics
                      </span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[#5871A5]" />
                        Assignee:{' '}
                        {demo.assignee_name ? (
                          <span className="text-[#223FA7] font-bold">{demo.assignee_name}</span>
                        ) : (
                          <span className="text-amber-700 italic font-medium">Unassigned</span>
                        )}
                      </p>
                      <p className="text-xs text-[#5871A5] mt-0.5">
                        By: {demo.requested_by_name || 'Field Sales'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-[#5871A5] uppercase tracking-wider block font-semibold">
                        Objective & Audience
                      </span>
                      <p className="font-semibold text-[#1A1A1A] mt-0.5 line-clamp-1">
                        {demo.purpose || 'Technical procurement qualification'}
                      </p>
                      <p className="text-xs text-[#5871A5] mt-0.5">
                        Audience: {demo.expected_audience || 'DGQA / Police Officers'}
                      </p>
                    </div>
                  </div>

                  {/* Reschedule / Cancellation Banner if applicable */}
                  {demo.reschedule_reason && (
                    <div className="p-2.5 mb-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>
                        <strong>Rescheduled from {demo.rescheduled_from}:</strong>{' '}
                        {demo.reschedule_reason}
                      </span>
                    </div>
                  )}

                  {demo.cancellation_reason && (
                    <div className="p-2.5 mb-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span>
                        <strong>Cancellation Reason:</strong> {demo.cancellation_reason}
                      </span>
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D6E3F5] pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAudit(demo)}
                        className="text-xs text-[#5871A5] hover:text-[#223FA7] hover:bg-[#EAF2FF]"
                      >
                        <History className="h-3.5 w-3.5 mr-1" />
                        Audit Trail
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Coordinator / Planning actions */}
                      {hasRole(['demo_team', 'management', 'regional_manager', 'admin']) &&
                        demo.status !== 'completed' &&
                        demo.status !== 'cancelled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssignTeam(demo)}
                              className="text-xs border-[#D6E3F5] text-indigo-700 hover:bg-indigo-50"
                            >
                              <Users className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                              Assign Team
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReserve(demo)}
                              className="text-xs border-[#D6E3F5] text-amber-700 hover:bg-amber-50"
                            >
                              <Package className="h-3.5 w-3.5 mr-1 text-amber-600" />
                              Reserve Unit
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDemo(demo);
                                setConfirmForm({
                                  confirmed_date:
                                    demo.confirmed_date ||
                                    demo.requested_date ||
                                    new Date().toISOString().split('T')[0],
                                  remarks: demo.remarks || '',
                                });
                                setIsConfirmDateOpen(true);
                              }}
                              className="text-xs border-[#D6E3F5] text-teal-700 hover:bg-teal-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-teal-600" />
                              Confirm Date
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDemo(demo);
                                setRescheduleForm({
                                  new_date:
                                    demo.confirmed_date ||
                                    demo.requested_date ||
                                    new Date().toISOString().split('T')[0],
                                  reason: '',
                                });
                                setIsRescheduleOpen(true);
                              }}
                              className="text-xs border-[#D6E3F5] text-purple-700 hover:bg-purple-50"
                            >
                              <Clock className="h-3.5 w-3.5 mr-1 text-purple-600" />
                              Reschedule
                            </Button>
                          </>
                        )}

                      {/* Outcome execution */}
                      {demo.status !== 'completed' && demo.status !== 'cancelled' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenOutcome(demo)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                          Record Outcome
                        </Button>
                      )}

                      {/* Cancel demo */}
                      {demo.status !== 'completed' && demo.status !== 'cancelled' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedDemo(demo);
                            setCancelForm({ cancellation_reason: 'customer_cancelled', remarks: '' });
                            setIsCancelOpen(true);
                          }}
                          className="text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: COORDINATOR PLANNING QUEUE                                  */}
      {/* =================================================================== */}
      {activeTab === 'coordinator' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-[#D6E3F5] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-600" />
                Demo Dispatch & Planning Workbench
              </h2>
              <p className="text-xs text-[#5871A5] mt-0.5">
                Review pending requests, confirm operational dates, detect depot location mismatches,
                and prevent equipment/team double bookings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">
                {demos.filter((d) => ['requested', 'under_planning'].includes(d.status)).length} Pending
                Review
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {demos
              .filter((d) =>
                ['requested', 'under_planning', 'team_assigned', 'equipment_reserved'].includes(d.status),
              )
              .map((demo) => (
                <Card key={demo.id} className="p-5 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs hover:border-[#9FC0F5] transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#223FA7] px-2 py-0.5 rounded bg-[#EAF2FF] border border-[#D6E3F5]">
                          {demo.demo_no}
                        </span>
                        <h4 className="font-bold text-[#1A1A1A]">{demo.organisation_name}</h4>
                        {renderStatusBadge(demo.status)}
                      </div>
                      <div className="text-xs text-[#5871A5] mt-2 space-y-1">
                        <p>
                          <strong className="text-[#1A1A1A]">Site Location:</strong> {demo.location || 'Client Proving Ground'}
                        </p>
                        <p>
                          <strong className="text-[#1A1A1A]">Product:</strong> {demo.product_name || 'Security Scanning Unit'}
                        </p>
                        <p>
                          <strong className="text-[#1A1A1A]">Requested Date:</strong> {demo.requested_date}
                        </p>
                        <p>
                          <strong className="text-[#1A1A1A]">Purpose:</strong> {demo.purpose || 'Qualify tender criteria'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignTeam(demo)}
                        className="text-xs border-[#D6E3F5] text-indigo-700 hover:bg-indigo-50"
                      >
                        <Users className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                        {demo.assigned_to ? 'Change Team' : 'Assign Team'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReserve(demo)}
                        className="text-xs border-[#D6E3F5] text-amber-700 hover:bg-amber-50"
                      >
                        <Package className="h-3.5 w-3.5 mr-1 text-amber-600" />
                        Reserve Depot Unit
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedDemo(demo);
                          setConfirmForm({
                            confirmed_date:
                              demo.confirmed_date ||
                              demo.requested_date ||
                              new Date().toISOString().split('T')[0],
                            remarks: demo.remarks || '',
                          });
                          setIsConfirmDateOpen(true);
                        }}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirm Date
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: DEPOT FLEET & LIVE AVAILABILITY CHECKER                     */}
      {/* =================================================================== */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Live Availability Checker Box (§8) */}
          <Card className="p-5 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D6E3F5] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#223FA7]" />
                  Live Fleet Availability & Conflict Checker (§8 & §10)
                </h3>
                <p className="text-xs text-[#5871A5] mt-1">
                  Query inventory across Delhi, Patna, and Kolkata depots for specific dates to prevent
                  committing unavailable equipment.
                </p>
              </div>

              {hasRole(['demo_team', 'service_team', 'admin']) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEquipmentForm({
                      id: '',
                      product_id: products[0]?.id || '',
                      model: '',
                      serial_no: '',
                      current_location: 'Delhi',
                      condition: 'Operational',
                      remarks: '',
                    });
                    setIsEquipmentModalOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Depot Unit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select
                label="Product Line"
                value={availFilterProduct}
                onChange={(e) => setAvailFilterProduct(e.target.value)}
                options={[
                  { label: 'All Products', value: '' },
                  ...products.map((p) => ({ label: p.name, value: p.id })),
                ]}
              />

              <Select
                label="Depot Location"
                value={availFilterLocation}
                onChange={(e) => setAvailFilterLocation(e.target.value)}
                options={[
                  { label: 'All Depots (Delhi, Patna, Kolkata)', value: '' },
                  { label: 'Delhi Central Depot', value: 'Delhi' },
                  { label: 'Patna Regional Depot', value: 'Patna' },
                  { label: 'Kolkata East Depot', value: 'Kolkata' },
                ]}
              />

              <Input
                label="Target Trial Date"
                type="date"
                value={availFilterDate}
                onChange={(e) => setAvailFilterDate(e.target.value)}
              />
            </div>

            {/* Availability Summary Stats */}
            {availabilityResults && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#D6E3F5]">
                <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5]">
                  <span className="text-xs text-[#5871A5] block">Total Units</span>
                  <span className="text-xl font-bold text-[#1A1A1A]">
                    {availabilityResults.summary.total}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-medium text-emerald-700 block">Available Now</span>
                  <span className="text-xl font-bold text-emerald-800">
                    {availabilityResults.summary.available}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-xs font-medium text-amber-700 block">Reserved for Demos</span>
                  <span className="text-xl font-bold text-amber-800">
                    {availabilityResults.summary.reserved}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-xs font-medium text-rose-700 block">In Maintenance</span>
                  <span className="text-xl font-bold text-rose-800">
                    {availabilityResults.summary.maintenance}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Depot Fleet Inventory Table */}
          <Card className="p-0 overflow-hidden bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
            <div className="p-4 border-b border-[#D6E3F5] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Depot Units Roster ({equipmentList.length} Units Total)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#1A1A1A]">
                <thead className="bg-[#F7FBFF] text-xs uppercase tracking-wider text-[#5871A5] border-b border-[#D6E3F5]">
                  <tr>
                    <th className="py-3 px-4">Model & Serial</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Current Depot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Reserved Until</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECF8]">
                  {equipmentList.map((unit) => (
                    <tr key={unit.id} className="hover:bg-[#F0F5FF] transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#1A1A1A]">{unit.model}</p>
                        <span className="font-mono text-xs text-[#5871A5]">
                          {unit.serial_no || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5871A5]">{unit.product_name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-[#1A1A1A]">
                          <MapPin className="h-3.5 w-3.5 text-[#223FA7]" />
                          {unit.current_location}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {unit.availability_status === 'available' && (
                          <Badge variant="success">AVAILABLE</Badge>
                        )}
                        {unit.availability_status === 'reserved' && (
                          <Badge variant="warning">RESERVED</Badge>
                        )}
                        {unit.availability_status === 'in_use' && (
                          <Badge variant="info">IN FIELD TRIAL</Badge>
                        )}
                        {unit.availability_status === 'maintenance' && (
                          <Badge variant="danger">MAINTENANCE</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5871A5]">
                        {unit.condition || 'Operational'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-[#5871A5]">
                        {unit.reserved_until || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasRole(['demo_team', 'service_team', 'admin']) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEquipmentForm({
                                id: unit.id,
                                product_id: unit.product_id,
                                model: unit.model,
                                serial_no: unit.serial_no || '',
                                current_location: unit.current_location || 'Delhi',
                                condition: unit.condition || 'Operational',
                                remarks: unit.remarks || '',
                              });
                              setIsEquipmentModalOpen(true);
                            }}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: MANAGEMENT ANALYTICS & FAILURE ANALYSIS                     */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsData && (
            <>
              {/* Overview Metrics Cards */}
              <StatGrid columns={4}>
                <StatCard
                  label="Total Demos"
                  value={analyticsData.overview.total_demos}
                  subtext={`${analyticsData.overview.active_pipeline} active in pipeline`}
                  icon={<Layers className="h-4 w-4" />}
                />

                <StatCard
                  label="Completed Trials"
                  value={analyticsData.overview.completed_demos}
                  valueColor="emerald"
                  subtext={`${analyticsData.overview.successful} successful trials`}
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                />

                <StatCard
                  label="Trial Success Rate"
                  value={`${analyticsData.overview.success_rate_percent}%`}
                  valueColor="primary"
                  progress={analyticsData.overview.success_rate_percent}
                  progressColor="primary"
                  icon={<Sparkles className="h-4 w-4 text-[#223FA7]" />}
                />

                <StatCard
                  label="Cancelled / Rescheduled"
                  value={`${analyticsData.overview.cancelled_demos} / ${analyticsData.overview.rescheduled_demos}`}
                  valueColor="amber"
                  subtext="Fleet reallocations logged"
                  icon={<Clock className="h-4 w-4 text-amber-600" />}
                />
              </StatGrid>

              {/* Structured Failure Analysis Breakdown (§18 & §19) */}
              <Card className="p-6 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
                <SectionHeader
                  icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
                  title="Structured Demo Failure Analysis (§18)"
                  description="Categorized breakdown of trial deficiencies to guide technical R&D, product tuning, and sales training."
                  badge={<Badge variant="danger">{analyticsData.overview.unsuccessful} Total Failures</Badge>}
                  className="mb-4"
                />

                {analyticsData.failure_analysis.length === 0 ? (
                  <p className="text-sm text-[#5871A5] italic text-center py-6">
                    Zero unsuccessful demo trials recorded.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.failure_analysis.map((item: any) => (
                      <div key={item.reason} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1A1A1A]">
                            {item.reason.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[#5871A5] font-mono">
                            {item.count} trials ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#E2ECF8] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Depot Utilization Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.depot_fleet.map((depot: any) => (
                  <Card key={depot.current_location} className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
                    <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#223FA7]" />
                      {depot.current_location} Depot
                    </h4>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                      <div className="p-2 rounded bg-[#F7FBFF] border border-[#D6E3F5]">
                        <span className="text-[#5871A5] block">Total</span>
                        <span className="font-bold text-[#1A1A1A] text-sm">{depot.total_units}</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="block">Free</span>
                        <span className="font-bold text-sm">{depot.available_units}</span>
                      </div>
                      <div className="p-2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="block">Booked</span>
                        <span className="font-bold text-sm">{depot.reserved_units}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: CUSTOMER TRIAL HISTORY                                      */}
      {/* =================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs">
            <SectionHeader
              icon={<History className="h-5 w-5 text-[#223FA7]" />}
              title="Customer Demonstration & Field Trial Timeline (§20)"
              description="Select an organisation to view the complete history of trials, certificates, outcomes, and follow-up actions."
            />

            <div className="mt-4 max-w-md">
              <Select
                label="Select Organisation / Department"
                value={selectedHistoryOrgId}
                onChange={(e) => loadCustomerHistory(e.target.value)}
                options={[
                  { label: '— Select a Client Organisation —', value: '' },
                  ...organisations.map((org) => ({ label: org.name, value: org.id })),
                ]}
              />
            </div>
          </Card>

          {selectedHistoryOrgId && (
            <div className="space-y-4">
              {customerHistoryDemos.length === 0 ? (
                <EmptyState
                  icon={<Building className="h-6 w-6" />}
                  title="No Field Demonstrations Recorded"
                  description="No historical field demonstration trials are on record for this organisation yet."
                />
              ) : (
                customerHistoryDemos.map((demo) => (
                  <Card key={demo.id} className="p-5 bg-white border border-[#D6E3F5] rounded-xl shadow-2xs hover:border-[#9FC0F5] transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#D6E3F5] pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#223FA7]">
                          {demo.demo_no}
                        </span>
                        <h4 className="text-base font-semibold text-[#1A1A1A]">
                          {demo.product_name || 'Security Equipment Trial'}
                        </h4>
                      </div>
                      <div>{renderStatusBadge(demo.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs text-[#1A1A1A]">
                      <div>
                        <span className="text-[#5871A5] block">Date & Site:</span>
                        <span>
                          {demo.confirmed_date || demo.requested_date} @ {demo.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5871A5] block">Demo Specialist:</span>
                        <span>{demo.assignee_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[#5871A5] block">Sales Contact:</span>
                        <span>{demo.requested_by_name || 'Direct'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-[#1A1A1A] space-y-1">
                      <p>
                        <strong>Purpose:</strong> {demo.purpose || 'Trial evaluation'}
                      </p>
                      {demo.remarks && (
                        <p>
                          <strong>Notes:</strong> {demo.remarks}
                        </p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALS                                                              */}
      {/* =================================================================== */}

      {/* 1. New Demo Request Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Demo Trial Request (§1)"
      >
        <form onSubmit={handleCreateDemo} className="space-y-4 text-sm">
          <Select
            label="Client Organisation *"
            value={newDemo.organisation_id}
            onChange={(e) => {
              const orgId = e.target.value;
              const org = organisations.find((o) => o.id === orgId);
              setNewDemo({
                ...newDemo,
                organisation_id: orgId,
                location: org ? `${org.city || 'Depot Site'}` : newDemo.location,
              });
            }}
            options={[
              { label: '— Select Client Organisation —', value: '' },
              ...organisations.map((o) => ({ label: o.name, value: o.id })),
            ]}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Product to Demonstrate"
              value={newDemo.product_id}
              onChange={(e) => setNewDemo({ ...newDemo, product_id: e.target.value })}
              options={[
                { label: '— Select Security Product —', value: '' },
                ...products.map((p) => ({ label: p.name, value: p.id })),
              ]}
            />

            <Input
              label="Requested Trial Date *"
              type="date"
              value={newDemo.requested_date}
              onChange={(e) => setNewDemo({ ...newDemo, requested_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Demo Site Location *"
              placeholder="e.g. CRPF Group Centre, Delhi"
              value={newDemo.location}
              onChange={(e) => setNewDemo({ ...newDemo, location: e.target.value })}
              required
            />

            <Input
              label="Expected Audience"
              placeholder="e.g. DIG Technical & Procurement Board"
              value={newDemo.expected_audience}
              onChange={(e) => setNewDemo({ ...newDemo, expected_audience: e.target.value })}
            />
          </div>

          <Input
            label="Purpose of Demonstration *"
            placeholder="e.g. Live detection rate verification for GeM tender bid"
            value={newDemo.purpose}
            onChange={(e) => setNewDemo({ ...newDemo, purpose: e.target.value })}
            required
          />

          <Input
            label="Equipment / Accessories Required"
            placeholder="e.g. DFMD unit with backup test pieces and calibrated target rods"
            value={newDemo.equipment_required}
            onChange={(e) => setNewDemo({ ...newDemo, equipment_required: e.target.value })}
          />

          <Input
            label="Special Requirements / Site Conditions"
            placeholder="e.g. Outdoor proving ground; generator power supply needed"
            value={newDemo.special_requirements}
            onChange={(e) => setNewDemo({ ...newDemo, special_requirements: e.target.value })}
          />

          {/* Travel Requirement Toggle (§12) */}
          <div className="p-3 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-3">
            <Checkbox
              checked={newDemo.travel_required}
              onChange={(e) => setNewDemo({ ...newDemo, travel_required: e.target.checked })}
              label="Travel Required for Demo Team (§12)"
            />

            {newDemo.travel_required && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-[#D6E3F5]">
                <Input
                  label="From Depot"
                  value={newDemo.travel_from}
                  onChange={(e) => setNewDemo({ ...newDemo, travel_from: e.target.value })}
                />
                <Input
                  label="To Destination"
                  value={newDemo.travel_to}
                  onChange={(e) => setNewDemo({ ...newDemo, travel_to: e.target.value })}
                  placeholder="e.g. Patna Proving Site"
                />
                <Input
                  label="Travel Date"
                  type="date"
                  value={newDemo.travel_date}
                  onChange={(e) => setNewDemo({ ...newDemo, travel_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Demo Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Team Assignment Modal (§5 & §11) */}
      <Modal
        isOpen={isAssignTeamOpen}
        onClose={() => setIsAssignTeamOpen(false)}
        title={`Assign Demo Team Member — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleAssignTeamSubmit} className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-[#1A1A1A]">
            <p>
              <strong>Client:</strong> {selectedDemo?.organisation_name}
            </p>
            <p>
              <strong>Location:</strong> {selectedDemo?.location}
            </p>
            <p>
              <strong>Target Date:</strong>{' '}
              {teamForm.confirmed_date || selectedDemo?.requested_date}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Select Demo Specialist (Live Conflict & Availability Check §11) *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-[#D6E3F5] rounded-lg p-2 bg-[#F7FBFF]">
              {teamMembers.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    teamForm.assigned_to === member.id
                      ? 'bg-[#EAF2FF] border-[#223FA7] text-[#1A1A1A]'
                      : member.is_available
                      ? 'bg-white border-[#D6E3F5] text-[#1A1A1A] hover:bg-[#F0F5FF]'
                      : 'bg-rose-50 border-rose-200 text-rose-800 opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="team_member"
                      value={member.id}
                      checked={teamForm.assigned_to === member.id}
                      onChange={() => setTeamForm({ ...teamForm, assigned_to: member.id })}
                    />
                    <div>
                      <p className="font-semibold text-xs text-[#1A1A1A]">{member.full_name}</p>
                      <span className="text-[10px] text-[#5871A5]">
                        {member.role.replace(/_/g, ' ')} • {member.phone || 'No phone'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {member.is_available ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        AVAILABLE
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                        title={`Conflict: Assigned to ${member.active_demo?.demo_no} at ${member.active_demo?.location}`}
                      >
                        BUSY: {member.active_demo?.demo_no || 'Assigned'}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Confirm Trial Date"
              type="date"
              value={teamForm.confirmed_date}
              onChange={(e) => {
                setTeamForm({ ...teamForm, confirmed_date: e.target.value });
                loadTeamAvailability(e.target.value);
              }}
            />

            <Input
              label="Planning Remarks"
              placeholder="e.g. Client requested 09:30 AM early briefing"
              value={teamForm.remarks}
              onChange={(e) => setTeamForm({ ...teamForm, remarks: e.target.value })}
            />
          </div>

          {/* Travel Requirement Options */}
          <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] space-y-2">
            <Checkbox
              checked={teamForm.travel_required}
              onChange={(e) => setTeamForm({ ...teamForm, travel_required: e.target.checked })}
              label="Travel Required for Specialist"
            />

            {teamForm.travel_required && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-[#D6E3F5]">
                <Input
                  label="From"
                  value={teamForm.travel_from}
                  onChange={(e) => setTeamForm({ ...teamForm, travel_from: e.target.value })}
                />
                <Input
                  label="To"
                  value={teamForm.travel_to}
                  onChange={(e) => setTeamForm({ ...teamForm, travel_to: e.target.value })}
                />
                <Input
                  label="Travel Date"
                  type="date"
                  value={teamForm.travel_date}
                  onChange={(e) => setTeamForm({ ...teamForm, travel_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsAssignTeamOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!teamForm.assigned_to}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Reserve Equipment Modal (§9 & §10) */}
      <Modal
        isOpen={isReserveEquipOpen}
        onClose={() => setIsReserveEquipOpen(false)}
        title={`Reserve Equipment Unit — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleReserveSubmit} className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-[#1A1A1A]">
            <p>
              <strong>Demo Location:</strong> {selectedDemo?.location || 'Site'}
            </p>
            <p>
              <strong>Required Product:</strong> {selectedDemo?.product_name || 'Standard'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Reservation Start Date *"
              type="date"
              value={reserveForm.reserved_from}
              onChange={(e) => setReserveForm({ ...reserveForm, reserved_from: e.target.value })}
              required
            />
            <Input
              label="Reservation End Date *"
              type="date"
              value={reserveForm.reserved_to}
              onChange={(e) => setReserveForm({ ...reserveForm, reserved_to: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              Select Fleet Equipment Unit (Physical Serial Number §6 & §7) *
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto border border-[#D6E3F5] rounded-lg p-2 bg-[#F7FBFF]">
              {equipmentList.map((unit) => {
                const isLocationMismatch =
                  unit.current_location &&
                  selectedDemo?.location &&
                  !selectedDemo.location.toLowerCase().includes(unit.current_location.toLowerCase());

                return (
                  <label
                    key={unit.id}
                    className={`block p-2.5 rounded-lg border cursor-pointer transition-all ${
                      reserveForm.equipment_id === unit.id
                        ? 'bg-[#EAF2FF] border-[#223FA7] text-[#1A1A1A]'
                        : 'bg-white border-[#D6E3F5] text-[#1A1A1A] hover:bg-[#F0F5FF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="reserve_unit"
                          value={unit.id}
                          checked={reserveForm.equipment_id === unit.id}
                          onChange={() => setReserveForm({ ...reserveForm, equipment_id: unit.id })}
                        />
                        <div>
                          <p className="font-semibold text-xs text-[#1A1A1A]">
                            {unit.model} — {unit.serial_no || 'Unserialized'}
                          </p>
                          <span className="text-[10px] text-[#5871A5]">
                            Product: {unit.product_name} • Depot: {unit.current_location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isLocationMismatch && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                            title={`Depot (${unit.current_location}) differs from Demo Location (${selectedDemo?.location})`}
                          >
                            DEPOT MISMATCH
                          </span>
                        )}
                        <Badge
                          variant={unit.availability_status === 'available' ? 'success' : 'warning'}
                        >
                          {unit.availability_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <Input
            label="Reservation / Logistics Remarks"
            placeholder="e.g. Courier dispatch arranged via BlueDart secure air-cargo"
            value={reserveForm.remarks}
            onChange={(e) => setReserveForm({ ...reserveForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsReserveEquipOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!reserveForm.equipment_id}
            >
              Lock Reservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Confirm Date Modal (§14) */}
      <Modal
        isOpen={isConfirmDateOpen}
        onClose={() => setIsConfirmDateOpen(false)}
        title={`Confirm Demo Date — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleConfirmDateSubmit} className="space-y-4 text-sm">
          <p className="text-xs text-[#5871A5]">
            Requested date is <strong>{selectedDemo?.requested_date}</strong>. Confirm the final
            scheduled date approved by client command.
          </p>

          <Input
            label="Final Confirmed Date *"
            type="date"
            value={confirmForm.confirmed_date}
            onChange={(e) => setConfirmForm({ ...confirmForm, confirmed_date: e.target.value })}
            required
          />

          <Input
            label="Confirmation Remarks"
            placeholder="e.g. Site gate pass sanctioned by DIG office"
            value={confirmForm.remarks}
            onChange={(e) => setConfirmForm({ ...confirmForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsConfirmDateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Confirm Date
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Reschedule Modal (§16) */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title={`Reschedule Demo — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Current Date: <strong>{selectedDemo?.confirmed_date || selectedDemo?.requested_date}</strong>.
            Rescheduling will update or release reserved equipment and re-verify specialist availability.
          </div>

          <Input
            label="New Demonstration Date *"
            type="date"
            value={rescheduleForm.new_date}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_date: e.target.value })}
            required
          />

          <Input
            label="Rescheduling Reason (MANDATORY §16) *"
            placeholder="e.g. Client inspection postponed due to state VIP security deployment"
            value={rescheduleForm.reason}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!rescheduleForm.reason}
            >
              Reschedule Demo
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Cancel Demo Modal (§15) */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title={`Cancel Demonstration — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            Cancelling this demonstration will immediately release all reserved equipment units back to
            the depot pool and relieve assigned team members.
          </div>

          <Select
            label="Cancellation Reason (MANDATORY §15) *"
            value={cancelForm.cancellation_reason}
            onChange={(e) => setCancelForm({ ...cancelForm, cancellation_reason: e.target.value })}
            options={[
              { label: 'Customer Cancelled / Postponed Indefinitely', value: 'customer_cancelled' },
              { label: 'Equipment Unavailable at Depot', value: 'equipment_unavailable' },
              { label: 'Demo Specialist Unavailable', value: 'team_unavailable' },
              { label: 'Date Conflict with Higher Priority Trial', value: 'date_conflict' },
              { label: 'Commercial Issue / Budget Frozen', value: 'commercial_issue' },
              { label: 'Other Operational Circumstance', value: 'other' },
            ]}
            required
          />

          <Input
            label="Detailed Remarks / Context"
            placeholder="e.g. Letter received from Procurement Directorate dated 21-Sep"
            value={cancelForm.remarks}
            onChange={(e) => setCancelForm({ ...cancelForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsCancelOpen(false)}>
              Close
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Confirm Cancellation & Release Resources
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Outcome & Structured Failure Analysis Modal (§17 & §18) */}
      <Modal
        isOpen={isOutcomeOpen}
        onClose={() => setIsOutcomeOpen(false)}
        title={`Record Demo Outcome & Failure Analysis — ${selectedDemo?.demo_no}`}
      >
        <form onSubmit={handleOutcomeSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Overall Demo Result *"
              value={outcomeForm.result}
              onChange={(e: any) => setOutcomeForm({ ...outcomeForm, result: e.target.value })}
              options={[
                { label: 'Successful Trial (Specs Verified)', value: 'success' },
                { label: 'Unsuccessful Trial (Deficiency / Issue)', value: 'fail' },
                { label: 'Partial Demonstration', value: 'partial' },
              ]}
              required
            />

            <div className="flex items-center pt-6">
              <Checkbox
                checked={outcomeForm.decision_maker_present}
                onChange={(e) =>
                  setOutcomeForm({ ...outcomeForm, decision_maker_present: e.target.checked })
                }
                label="Decision-Maker Attended Trial (§17)"
              />
            </div>
          </div>

          {/* Structured Failure Reason (§18) - STRICTLY REQUIRED IF RESULT IS FAIL */}
          {outcomeForm.result === 'fail' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-700 block">
                Structured Failure Reason (REQUIRED FOR ANALYTICS §18) *
              </span>
              <Select
                value={outcomeForm.failure_reason}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, failure_reason: e.target.value })}
                options={[
                  { label: 'TECHNICAL_FAILURE — Device malfunctional / disconnected', value: 'TECHNICAL_FAILURE' },
                  { label: 'EQUIPMENT_ISSUE — Battery / power / hardware calibration fault', value: 'EQUIPMENT_ISSUE' },
                  { label: 'PRODUCT_LIMITATION — Product specs did not meet tender criteria', value: 'PRODUCT_LIMITATION' },
                  { label: 'CUSTOMER_REQUIREMENT_MISMATCH — Client requested unfeasible custom spec', value: 'CUSTOMER_REQUIREMENT_MISMATCH' },
                  { label: 'PRICING_CONCERN — Target price expectation exceeded', value: 'PRICING_CONCERN' },
                  { label: 'DECISION_MAKER_UNAVAILABLE — Key procurement officer absent', value: 'DECISION_MAKER_UNAVAILABLE' },
                  { label: 'COMPETITOR_PREFERENCE — Client inclined towards competitor brand', value: 'COMPETITOR_PREFERENCE' },
                  { label: 'DEMO_PREPARATION_ISSUE — Site test targets / power unprepared', value: 'DEMO_PREPARATION_ISSUE' },
                  { label: 'OTHER — Custom operational failure reason', value: 'OTHER' },
                ]}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Customer Response *"
              placeholder="e.g. Positive response; requested formal quote"
              value={outcomeForm.customer_response}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, customer_response: e.target.value })}
              required
            />
            <Input
              label="Technical Performance"
              placeholder="e.g. 100% detection rate during 50-pass trial"
              value={outcomeForm.technical_performance}
              onChange={(e) =>
                setOutcomeForm({ ...outcomeForm, technical_performance: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Product Suitability"
              placeholder="e.g. Fully compliant with MHA guidelines"
              value={outcomeForm.product_suitability}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, product_suitability: e.target.value })}
            />
            <Input
              label="Competitor Involved (if any)"
              placeholder="e.g. Godrej, Smiths Detection"
              value={outcomeForm.competitor_involved}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, competitor_involved: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Next Commercial Step"
              placeholder="e.g. Commercial proposal submission"
              value={outcomeForm.next_step}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, next_step: e.target.value })}
            />
            <Select
              label="Opportunity Stage"
              value={outcomeForm.opportunity_stage}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, opportunity_stage: e.target.value })}
              options={[
                { label: 'Prospect', value: 'Prospect' },
                { label: 'Qualification', value: 'Qualification' },
                { label: 'Proposal', value: 'Proposal' },
                { label: 'GeM Tender Bid', value: 'Tender' },
                { label: 'Closed Won', value: 'Closed Won' },
                { label: 'Closed Lost', value: 'Closed Lost' },
              ]}
            />
          </div>

          <Input
            label="Detailed Outcome Remarks / Trial Notes"
            placeholder="e.g. Demonstrated to DIG and 4 DSPs. Clean technical pass."
            value={outcomeForm.remarks}
            onChange={(e) => setOutcomeForm({ ...outcomeForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsOutcomeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Complete Demo & Update Customer History
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Audit Trail Modal (§23) */}
      <Modal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        title={`Audit Trail & Change History — ${selectedDemo?.demo_no}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs">
          {selectedDemoAudit?.reschedule_events?.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-semibold text-[#1A1A1A] text-xs">Rescheduling History:</h5>
              {selectedDemoAudit.reschedule_events.map((res: any) => (
                <div key={res.id} className="p-2.5 rounded bg-[#F7FBFF] border border-[#D6E3F5]">
                  <p className="font-medium text-[#1A1A1A]">
                    Moved from {res.old_date || 'Initial Date'} &rarr; {res.new_date}
                  </p>
                  <p className="text-[#5871A5] mt-0.5 italic">Reason: "{res.reason}"</p>
                  <p className="text-[10px] text-[#5871A5] mt-1">
                    By: {res.actor_name || 'Coordinator'} ({res.actor_role}) on{' '}
                    {new Date(res.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h5 className="font-semibold text-[#1A1A1A] text-xs">System Events:</h5>
            {selectedDemoAudit?.audit_logs?.map((log: any) => (
              <div key={log.id} className="p-2 rounded bg-[#F7FBFF] border border-[#D6E3F5]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[#223FA7]">{log.action}</span>
                  <span className="text-[10px] text-[#5871A5]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[#5871A5] mt-1">
                  Actor: {log.actor_name} ({log.actor_role})
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#D6E3F5]">
            <Button variant="outline" size="sm" onClick={() => setIsAuditOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Add / Edit Equipment Unit Modal */}
      <Modal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        title={equipmentForm.id ? 'Edit Depot Equipment Unit' : 'Add New Depot Equipment Unit (§6)'}
      >
        <form onSubmit={handleSaveEquipment} className="space-y-4 text-sm">
          <Select
            label="Product Line *"
            value={equipmentForm.product_id}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, product_id: e.target.value })}
            options={[
              { label: '— Select Product —', value: '' },
              ...products.map((p) => ({ label: p.name, value: p.id })),
            ]}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Model Code *"
              placeholder="e.g. DFMD-MULTI-9"
              value={equipmentForm.model}
              onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
              required
            />
            <Input
              label="Serial Number (Unique §6) *"
              placeholder="e.g. DFMD-DEL-03"
              value={equipmentForm.serial_no}
              onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_no: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Depot Location *"
              value={equipmentForm.current_location}
              onChange={(e) =>
                setEquipmentForm({ ...equipmentForm, current_location: e.target.value })
              }
              options={[
                { label: 'Delhi Central Depot', value: 'Delhi' },
                { label: 'Patna Regional Depot', value: 'Patna' },
                { label: 'Kolkata East Depot', value: 'Kolkata' },
              ]}
              required
            />

            <Select
              label="Operational Condition"
              value={equipmentForm.condition}
              onChange={(e) => setEquipmentForm({ ...equipmentForm, condition: e.target.value })}
              options={[
                { label: 'Operational (Ready for Field Trial)', value: 'Operational' },
                { label: 'Good (Minor Cosmetic Wear)', value: 'Good' },
                { label: 'Requires Calibration', value: 'Requires Calibration' },
                { label: 'Maintenance Underway', value: 'Maintenance' },
              ]}
            />
          </div>

          <Input
            label="Remarks / Notes"
            placeholder="e.g. Staged with heavy-duty wheeled flight case"
            value={equipmentForm.remarks}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E3F5]">
            <Button variant="outline" type="button" onClick={() => setIsEquipmentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Equipment Unit
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
