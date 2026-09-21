'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  MapPin,
  Building,
  User,
  Clock,
  AlertCircle,
  FileEdit,
  CheckCircle2,
  XCircle,
  Sparkles,
  Receipt,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Layers,
  History,
  Route,
  Navigation,
  Car,
  ChevronRight,
  Info,
  CalendarDays,
  FileText,
  AlertTriangle,
  Users,
  Compass,
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

export default function VisitsPage() {
  const { user, hasRole } = useAuth();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'my_visits' | 'manager_dashboard' | 'trips' | 'customer_history' | 'employee_activity'>('my_visits');

  // Core Data
  const [visits, setVisits] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [managerData, setManagerData] = useState<any | null>(null);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedOrgHistory, setSelectedOrgHistory] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [employeeActivities, setEmployeeActivities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTravelOnly, setFilterTravelOnly] = useState(false);
  const [filterDemoOnly, setFilterDemoOnly] = useState(false);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isAddTripVisitOpen, setIsAddTripVisitOpen] = useState(false);
  const [isAlsoMeetOpen, setIsAlsoMeetOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Plan Visit Form
  const [newVisit, setNewVisit] = useState({
    organisation_id: '',
    organisation_name: '',
    location: '',
    planned_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 1 week in advance default
    start_time: '10:00',
    end_time: '11:30',
    purpose: '',
    contact_person: '',
    product_id: '',
    demo_required: false,
    travel_required: false,
    expected_outcome: '',
    remarks: '',
    trip_id: '',
  });

  // 2. Create Trip Form
  const [newTrip, setNewTrip] = useState({
    employee_id: '',
    trip_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    base_location: '',
    notes: '',
  });

  // 3. Add Visit to Trip Form
  const [tripVisit, setTripVisit] = useState({
    organisation_id: '',
    location: '',
    start_time: '14:00',
    end_time: '15:30',
    purpose: '',
    instructions: '',
    reason: 'Customer is in the same operational area',
  });

  // 4. Also Meet Form
  const [alsoMeetNotes, setAlsoMeetNotes] = useState('');

  // 5. Reschedule Form
  const [rescheduleData, setRescheduleData] = useState({
    new_date: '',
    start_time: '',
    end_time: '',
    reason: '',
  });

  // 6. Cancel Form
  const [cancelReason, setCancelReason] = useState('');

  // 7. Destination Form
  const [newDestination, setNewDestination] = useState({
    new_location: '',
    reason: '',
  });

  // 8. Post-Visit Report Form
  const [reportData, setReportData] = useState({
    met_completed: true,
    person_met: '',
    discussion: '',
    product_discussed: '',
    outcome: '',
    opportunity: '',
    tender_opportunity: '',
    demo_required: false,
    next_action: '',
    followup_date: '',
    remarks: '',
  });

  // -------------------------------------------------------------
  // Load All Master and Module Data
  // -------------------------------------------------------------
  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [visitsRes, tripsRes, orgsRes, prodsRes] = await Promise.all([
        api.get('/visits', {
          limit: 100,
          search: filterSearch || undefined,
          status: filterStatus || undefined,
          assigned_to: filterEmployee || undefined,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
          travel_required: filterTravelOnly ? 'true' : undefined,
          demo_required: filterDemoOnly ? 'true' : undefined,
        }),
        api.get('/visits/trips'),
        api.get('/organisations', { limit: 100 }),
        api.get('/products', { limit: 100 }).catch(() => api.get('/masters/products')).catch(() => []),
      ]);

      setVisits(visitsRes.data || []);
      setTrips(tripsRes || []);
      setOrganisations(orgsRes.data || []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : (prodsRes?.data || []));

      if (orgsRes.data && orgsRes.data.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgsRes.data[0].id);
      }

      // Load manager field activity if user has manager or management role
      if (hasRole(['management', 'regional_manager', 'admin'])) {
        const mgrRes = await api.get('/visits/manager/field-activity', {
          assigned_to: filterEmployee || undefined,
          status: filterStatus || undefined,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
        }).catch(() => null);
        setManagerData(mgrRes);

        const usersRes = await api.get('/users', { limit: 100 }).catch(() => ({ data: [] }));
        setUsersList(usersRes.data || []);
      }

      // Load employee activity
      if (user?.id) {
        const actRes = await api.get(`/visits/employees/${user.id}/activities`).catch(() => []);
        setEmployeeActivities(actRes || []);
      }
    } catch (err) {
      console.error('Failed to load visit planning data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterEmployee, filterDateFrom, filterDateTo, filterTravelOnly, filterDemoOnly]);

  // Load customer history when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId) {
      api.get(`/visits/organisations/${selectedOrgId}/history`)
        .then((data) => setSelectedOrgHistory(data || []))
        .catch(() => setSelectedOrgHistory([]));
    }
  }, [selectedOrgId]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      let orgId = newVisit.organisation_id;

      // Create organisation on the fly if not selected
      if (!orgId && newVisit.organisation_name) {
        const newOrg = await api.post('/organisations', {
          name: newVisit.organisation_name,
          city: newVisit.location || 'Delhi NCR',
          state: 'North',
        });
        orgId = newOrg.id;
      }

      if (!orgId) {
        throw new Error('Please select or specify an organisation.');
      }

      await api.post('/visits', {
        organisation_id: orgId,
        location: newVisit.location,
        planned_date: newVisit.planned_date,
        start_time: newVisit.start_time,
        end_time: newVisit.end_time,
        purpose: newVisit.purpose,
        contact_person: newVisit.contact_person || undefined,
        product_id: newVisit.product_id || undefined,
        demo_required: newVisit.demo_required,
        travel_required: newVisit.travel_required,
        expected_outcome: newVisit.expected_outcome,
        remarks: newVisit.remarks,
        trip_id: newVisit.trip_id || undefined,
      });

      setIsScheduleOpen(false);
      setNewVisit({
        organisation_id: '',
        organisation_name: '',
        location: '',
        planned_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:30',
        purpose: '',
        contact_person: '',
        product_id: '',
        demo_required: false,
        travel_required: false,
        expected_outcome: '',
        remarks: '',
        trip_id: '',
      });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to schedule field visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post('/visits/trips', {
        employee_id: newTrip.employee_id || user?.id,
        trip_date: newTrip.trip_date,
        base_location: newTrip.base_location,
        notes: newTrip.notes,
      });

      setIsCreateTripOpen(false);
      setNewTrip({
        employee_id: '',
        trip_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        base_location: '',
        notes: '',
      });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create tour program.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTripVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/trips/${selectedTrip.id}/visits`, {
        organisation_id: tripVisit.organisation_id,
        location: tripVisit.location,
        start_time: tripVisit.start_time,
        end_time: tripVisit.end_time,
        purpose: tripVisit.purpose,
        instructions: tripVisit.instructions,
        reason: tripVisit.reason,
      });

      setIsAddTripVisitOpen(false);
      setTripVisit({
        organisation_id: '',
        location: '',
        start_time: '14:00',
        end_time: '15:30',
        purpose: '',
        instructions: '',
        reason: 'Customer is in the same operational area',
      });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add customer visit to trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlsoMeetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/${selectedVisit.id}/intervention`, {
        instructions: alsoMeetNotes,
      });

      setIsAlsoMeetOpen(false);
      setAlsoMeetNotes('');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to attach manager directive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/${selectedVisit.id}/reschedule`, {
        new_date: rescheduleData.new_date,
        start_time: rescheduleData.start_time || undefined,
        end_time: rescheduleData.end_time || undefined,
        reason: rescheduleData.reason,
      });

      setIsRescheduleOpen(false);
      setRescheduleData({ new_date: '', start_time: '', end_time: '', reason: '' });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/${selectedVisit.id}/cancel`, {
        reason: cancelReason,
      });

      setIsCancelOpen(false);
      setCancelReason('');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDestinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/${selectedVisit.id}/destination`, {
        new_location: newDestination.new_location,
        reason: newDestination.reason,
      });

      setIsDestinationOpen(false);
      setNewDestination({ new_location: '', reason: '' });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update destination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/visits/${selectedVisit.id}/update`, {
        met_completed: reportData.met_completed,
        person_met: reportData.person_met,
        discussion: reportData.discussion,
        product_discussed: reportData.product_discussed,
        outcome: reportData.outcome,
        opportunity: reportData.opportunity,
        tender_opportunity: reportData.tender_opportunity,
        demo_required: reportData.demo_required,
        next_action: reportData.next_action || undefined,
        followup_date: reportData.followup_date || undefined,
        remarks: reportData.remarks,
      });

      setIsReportOpen(false);
      setReportData({
        met_completed: true,
        person_met: '',
        discussion: '',
        product_discussed: '',
        outcome: '',
        opportunity: '',
        tender_opportunity: '',
        demo_required: false,
        next_action: '',
        followup_date: '',
        remarks: '',
      });
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit post-visit update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAudit = async (visit: any) => {
    setSelectedVisit(visit);
    setIsAuditOpen(true);
    try {
      const logs = await api.get(`/visits/${visit.id}/audit`);
      setAuditLogs(logs || []);
    } catch (err) {
      setAuditLogs([]);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      case 'rescheduled':
        return <Badge variant="warning" size="sm">RESCHEDULED</Badge>;
      case 'modified':
        return <Badge variant="info" size="sm">MODIFIED</Badge>;
      case 'not_completed':
        return <Badge variant="default" size="sm">NOT COMPLETED</Badge>;
      default:
        return <Badge variant="info" size="sm">PLANNED</Badge>;
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = visits.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = visits.filter((v) => v.planned_date === today).length;
    const directives = visits.filter((v) => v.manager_assigned || v.remarks?.includes('Manager Directive') || v.assigned_by_manager).length;
    const completed = visits.filter((v) => v.status === 'completed').length;
    return { total, todayCount, directives, completed };
  }, [visits]);

  // Manager Visit Card rendering all 10 fields and manager directives
  const renderManagerVisitCard = (v: any) => (
    <div
      key={v.id}
      className="p-4 bg-white border border-[#D6E3F5] rounded-xl hover:border-[#9FC0F5] transition-all shadow-2xs space-y-3"
    >
      {/* Top row: Organisation, Tour tag, Requirement badges, Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[#1A1A1A] text-base">{v.organisation_name}</span>
            {v.trip_base_location && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Route className="h-3 w-3" />
                Tour: {v.trip_base_location}
              </span>
            )}
            {v.travel_required && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Compass className="h-3 w-3" />
                Travel Required
              </span>
            )}
            {v.demo_required && (
              <div className="flex items-center gap-1.5">
                {v.linked_demo_no ? (
                  <Link
                    href={`/demos?search=${v.linked_demo_no}`}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/25 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Linked Demo: {v.linked_demo_no}
                  </Link>
                ) : (
                  <Link
                    href={`/demos`}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Demo Required • Request Demo
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Key metadata row: Location, Date & Time, Assigned Officer, Contact Person */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5871A5] mt-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="font-medium text-gray-700">{v.location || 'HQ Station'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>
                {new Date(v.planned_date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                {v.start_time ? ` (${v.start_time}${v.end_time ? ` - ${v.end_time}` : ''})` : ''}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Officer: <strong className="text-gray-800">{v.assignee_name || 'Sales Staff'}</strong></span>
            </span>
            {(v.contact_name || v.contact_person) && (
              <span className="flex items-center gap-1 text-[#223FA7]">
                <Users className="h-3.5 w-3.5 text-[#223FA7] shrink-0" />
                <span>Contact: <strong className="text-gray-800">{v.contact_name || v.contact_person}</strong></span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge(v.status)}
        </div>
      </div>

      {/* Purpose & Product/Outcome 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 bg-[#F7FBFF] rounded-lg border border-[#D6E3F5]/60 space-y-1">
          <span className="text-[10px] font-bold text-[#5871A5] uppercase tracking-wider block">Visit Purpose</span>
          <p className="text-gray-800 font-medium">{v.purpose || 'Portfolio review & client engagement'}</p>
        </div>

        <div className="p-2.5 bg-[#F7FBFF] rounded-lg border border-[#D6E3F5]/60 space-y-1">
          <span className="text-[10px] font-bold text-[#5871A5] uppercase tracking-wider block">Product & Expected Outcome</span>
          <div className="flex items-center gap-1.5 text-gray-800 font-medium">
            <Layers className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{v.product_name || 'General Defence Portfolio'}</span>
          </div>
          {v.expected_outcome && (
            <p className="text-gray-600 text-[11px] italic mt-0.5">
              Outcome: {v.expected_outcome}
            </p>
          )}
        </div>
      </div>

      {/* Remarks & Manager Directives / Change Reasons */}
      {(v.remarks || v.change_reason) && (
        <div className="text-xs space-y-1">
          {v.remarks && (
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 flex items-start gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-gray-900">Remarks: </span>
                <span>{v.remarks}</span>
              </div>
            </div>
          )}
          {v.change_reason && (
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Schedule Change: </span>
                <span>{v.change_reason}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manager Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="text-[11px] text-[#5871A5]">
          Visit ID: <span className="font-mono text-gray-600 font-semibold">{v.id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedVisit(v);
              setAlsoMeetNotes(v.remarks?.includes('Manager Directive:') ? v.remarks.split('Manager Directive:')[1].trim() : '');
              setIsAlsoMeetOpen(true);
            }}
            className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1 text-amber-700" />
            <span>Also-Meet Directive</span>
          </Button>

          {['planned', 'modified', 'rescheduled'].includes(v.status) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedVisit(v);
                setRescheduleData({
                  new_date: v.planned_date,
                  start_time: v.start_time || '',
                  end_time: v.end_time || '',
                  reason: '',
                });
                setIsRescheduleOpen(true);
              }}
              className="text-[#223FA7] text-xs"
            >
              <span>Reschedule</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer>
      {/* ── TOP HERO BANNER: VISIT & FIELD PLANNING ── */}
      <PageHeader
        moduleBadge="Module 2"
        tagline="BOS-FIELD-OPS"
        icon={<Calendar className="h-7 w-7 text-[#223FA7]" />}
        title="Field Visits & Tour Operations"
        description="Weekly tour programs, multi-stop trips, regional manager directives, and post-visit intelligence."
        actions={
          <>
            <Button
              onClick={() => setIsCreateTripOpen(true)}
              variant="outline"
              className="border-[#D6E3F5] text-[#223FA7] hover:bg-[#F7FBFF] shadow-xs"
            >
              <Car className="h-4 w-4 mr-1.5" />
              <span>New Tour Program</span>
            </Button>

            <Button
              onClick={() => setIsScheduleOpen(true)}
              variant="primary"
              className="shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Plan Field Visit</span>
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <StatGrid columns={4}>
        <StatCard
          label="Total Field Visits"
          value={stats.total}
          subtext="Scheduled itineraries"
          icon={<CalendarDays className="h-4 w-4 text-[#223FA7]" />}
        />

        <StatCard
          label="Today's Visits"
          value={stats.todayCount}
          valueColor="emerald"
          subtext="Active deployments today"
          icon={<Clock className="h-4 w-4 text-emerald-600" />}
        />

        <StatCard
          label="Manager Directives"
          value={stats.directives}
          valueColor="amber"
          subtext='"Also-Meet" strategic guidance'
          icon={<Sparkles className="h-4 w-4 text-amber-600" />}
        />

        <StatCard
          label="Completed Reports"
          value={stats.completed}
          valueColor="primary"
          subtext="Intelligence & outcomes logged"
          icon={<CheckCircle2 className="h-4 w-4 text-[#223FA7]" />}
        />
      </StatGrid>

      {/* Main Tab Switcher */}
      <Tabs
        variant="pills"
        tabs={[
          {
            id: 'my_visits',
            label: `My Scheduled Visits`,
            icon: <Calendar className="h-3.5 w-3.5" />,
            count: visits.length,
          },
          ...(hasRole(['management', 'regional_manager', 'admin'])
            ? [
                {
                  id: 'manager_dashboard',
                  label: 'Manager Team Activity',
                  icon: <Shield className="h-3.5 w-3.5" />,
                },
              ]
            : []),
          {
            id: 'trips',
            label: 'Trips & Multi-Stop Plans',
            icon: <Route className="h-3.5 w-3.5" />,
            count: trips.length,
          },
          {
            id: 'customer_history',
            label: 'Customer Timeline',
            icon: <Building className="h-3.5 w-3.5" />,
          },
          {
            id: 'employee_activity',
            label: 'Employee Activity Dossier',
            icon: <History className="h-3.5 w-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="col-span-1 sm:col-span-2">
            <Input
              placeholder="Search organisation, city, officer, purpose..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'planned', label: 'Planned' },
              { value: 'modified', label: 'Modified' },
              { value: 'rescheduled', label: 'Rescheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'not_completed', label: 'Not Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          {/* Employee Filter (For Managers) */}
          {hasRole(['management', 'regional_manager', 'admin']) && (
            <Select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              options={[
                { value: '', label: 'All Team Members' },
                ...usersList.map((u) => ({ value: u.id, label: `${u.full_name} (${u.role})` })),
              ]}
            />
          )}

          {/* Date From */}
          <Input
            type="date"
            placeholder="From Date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="text-xs"
          />

          {/* Date To */}
          <Input
            type="date"
            placeholder="To Date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
            <Checkbox
              checked={filterTravelOnly}
              onChange={(e) => setFilterTravelOnly(e.target.checked)}
              label="Travel Required Only"
            />

            <Checkbox
              checked={filterDemoOnly}
              onChange={(e) => setFilterDemoOnly(e.target.checked)}
              label="Demo Required Only"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterSearch('');
              setFilterStatus('');
              setFilterEmployee('');
              setFilterDateFrom('');
              setFilterDateTo('');
              setFilterTravelOnly(false);
              setFilterDemoOnly(false);
              fetchData();
            }}
            className="text-xs text-[#5871A5]"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* TAB CONTENT: MY VISITS */}
      {activeTab === 'my_visits' && (
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              Loading field visit schedules...
            </div>
          ) : visits.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              No field visits match the active filters.
            </div>
          ) : (
            visits.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-xl border border-[#D6E3F5] bg-white hover:border-[#3770E3] transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(v.status)}

                      {v.manager_assigned && (
                        <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 border-amber-300">
                          MANAGER ASSIGNED
                        </Badge>
                      )}

                      {v.travel_required && (
                        <Badge variant="info" size="sm" className="bg-blue-50 text-blue-800 border-blue-200">
                          TRAVEL REQUIRED
                        </Badge>
                      )}

                      {v.demo_required && (
                        v.linked_demo_no ? (
                          <Link
                            href={`/demos?search=${v.linked_demo_no}`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/25 hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            DEMO: {v.linked_demo_no}
                          </Link>
                        ) : (
                          <Badge variant="default" size="sm" className="bg-purple-50 text-purple-800 border-purple-200">
                            DEMO TRIAL REQ.
                          </Badge>
                        )
                      )}

                      <span className="text-sm font-bold text-[#1A1A1A]">
                        {v.organisation_name || 'Client Agency'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5871A5]">
                      <span className="flex items-center gap-1 text-gray-700 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#223FA7]" />
                        {v.location || 'Site Location'}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-[#5871A5]" />
                        {new Date(v.planned_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {v.start_time ? ` • ${v.start_time} - ${v.end_time || ''}` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-[#5871A5]">
                        <User className="h-3.5 w-3.5 text-[#5871A5]" />
                        Officer: {v.assignee_name || 'Sales Staff'}
                      </span>
                      {v.product_name && (
                        <span className="flex items-center gap-1 text-emerald-800 font-medium">
                          <Layers className="h-3.5 w-3.5 text-emerald-600" />
                          Product: {v.product_name}
                        </span>
                      )}
                      {(v.contact_name || v.contact_person) && (
                        <span className="flex items-center gap-1 text-[#223FA7] font-medium">
                          <User className="h-3.5 w-3.5 text-[#223FA7]" />
                          Contact: <span className="font-semibold text-gray-800">{v.contact_name || v.contact_person}</span>
                        </span>
                      )}
                    </div>

                    {v.purpose && (
                      <p className="text-xs text-gray-700 pt-1 font-medium">
                        <span className="text-[#5871A5] font-semibold">Purpose:</span> {v.purpose}
                      </p>
                    )}

                    {v.expected_outcome && (
                      <p className="text-xs text-[#5871A5]">
                        <span className="font-semibold text-gray-600">Expected Outcome:</span> {v.expected_outcome}
                      </p>
                    )}

                    {v.remarks && !v.remarks.startsWith('Manager Directive:') && (
                      <p className="text-xs text-[#5871A5] bg-[#F7FBFF] px-2.5 py-1.5 rounded-lg border border-[#D6E3F5] mt-1">
                        <span className="font-semibold text-gray-700">Remarks: </span>
                        {v.remarks}
                      </p>
                    )}

                    {v.change_reason && (
                      <div className="text-xs text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200 mt-1">
                        <span className="font-bold">Change Reason:</span> {v.change_reason}
                        {v.rescheduled_from && (
                          <span className="text-amber-700 ml-2">(Rescheduled from {new Date(v.rescheduled_from).toLocaleDateString('en-IN')})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Manager Also-Meet Intervention */}
                    {hasRole(['management', 'regional_manager', 'admin']) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisit(v);
                          setAlsoMeetNotes(v.remarks?.includes('Manager Directive:') ? v.remarks.split('Manager Directive:')[1].trim() : '');
                          setIsAlsoMeetOpen(true);
                        }}
                        className="border-amber-300 text-amber-800 hover:bg-amber-50"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        <span>Also-Meet Directive</span>
                      </Button>
                    )}

                    {/* Post-Visit Update: only for planned or modified or rescheduled visits */}
                    {['planned', 'modified', 'rescheduled'].includes(v.status) && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedVisit(v);
                            setReportData({
                              met_completed: true,
                              person_met: '',
                              discussion: '',
                              product_discussed: v.product_name || '',
                              outcome: '',
                              opportunity: '',
                              tender_opportunity: '',
                              demo_required: v.demo_required || false,
                              next_action: '',
                              followup_date: '',
                              remarks: '',
                            });
                            setIsReportOpen(true);
                          }}
                        >
                          <FileEdit className="h-3.5 w-3.5 mr-1" />
                          <span>Submit Report</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedVisit(v);
                            setRescheduleData({
                              new_date: v.planned_date,
                              start_time: v.start_time || '',
                              end_time: v.end_time || '',
                              reason: '',
                            });
                            setIsRescheduleOpen(true);
                          }}
                          className="text-[#223FA7]"
                        >
                          <span>Reschedule</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedVisit(v);
                            setNewDestination({
                              new_location: v.location || '',
                              reason: '',
                            });
                            setIsDestinationOpen(true);
                          }}
                          className="text-gray-700"
                        >
                          <span>Change Station</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedVisit(v);
                            setCancelReason('');
                            setIsCancelOpen(true);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <span>Cancel</span>
                        </Button>
                      </>
                    )}

                    {/* Claim Expense for this visit */}
                    <Link href={`/expenses?visit_id=${v.id}`}>
                      <Button size="sm" variant="ghost" className="text-[#223FA7]">
                        <Receipt className="h-3.5 w-3.5 mr-1 text-[#5871A5]" />
                        <span>Claim Expense</span>
                      </Button>
                    </Link>

                    {/* Audit History */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenAudit(v)}
                      className="text-gray-500 hover:text-gray-800"
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Manager "Also-Meet" Banner Callout */}
                {(v.manager_assigned || v.remarks?.includes('Manager Directive')) && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3 shadow-xs">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-800 uppercase tracking-wider block text-[10px]">
                        REGIONAL MANAGER STRATEGIC "ALSO-MEET" DIRECTIVE:
                      </span>
                      <p className="mt-0.5 font-medium leading-relaxed">
                        {v.remarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Completed Report Callout */}
                {v.updates && v.updates.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-gray-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#223FA7] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        POST-VISIT INTELLIGENCE LOGGED:
                      </span>
                      {v.updates[0].updated_by_name && (
                        <span className="text-[10px] text-[#5871A5]">Logged by {v.updates[0].updated_by_name}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-bold text-gray-700">Person Met: </span>
                        <span>{v.updates[0].person_met || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Outcome: </span>
                        <span>{v.updates[0].outcome || 'Completed'}</span>
                      </div>
                    </div>
                    {v.updates[0].discussion && (
                      <p className="text-gray-700 italic border-l-2 border-[#3770E3] pl-2 mt-1">
                        "{v.updates[0].discussion}"
                      </p>
                    )}
                    {v.updates[0].followup_date && (
                      <div className="text-[11px] text-[#223FA7] font-semibold flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Next Follow-up Commitment: {new Date(v.updates[0].followup_date).toLocaleDateString('en-IN')}
                        {v.updates[0].next_action ? ` — ${v.updates[0].next_action}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: MANAGER DASHBOARD (TEAM FIELD ACTIVITY) */}
      {activeTab === 'manager_dashboard' && managerData && (
        <div className="space-y-6">
          {/* Summary counters banner */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-200">Team Field Deployment Horizon</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              <div>
                <span className="text-2xl font-black">{managerData.summary?.todayCount || 0}</span>
                <span className="block text-xs text-blue-200">Deployed Today</span>
              </div>
              <div>
                <span className="text-2xl font-black">{managerData.summary?.tomorrowCount || 0}</span>
                <span className="block text-xs text-blue-200">Tomorrow</span>
              </div>
              <div>
                <span className="text-2xl font-black">{managerData.summary?.next7DaysCount || 0}</span>
                <span className="block text-xs text-blue-200">Next 7 Days</span>
              </div>
              <div>
                <span className="text-2xl font-black">{managerData.summary?.laterCount || 0}</span>
                <span className="block text-xs text-blue-200">Later</span>
              </div>
            </div>
          </div>

          {/* Group 1: Today */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Today's Deployed Operations ({managerData.grouped?.today?.length || 0})</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-700">Live Field Status</span>
            </h3>
            {(!managerData.grouped?.today || managerData.grouped?.today?.length === 0) ? (
              <p className="text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-gray-200">No field visits scheduled for today.</p>
            ) : (
              managerData.grouped?.today?.map((v: any) => renderManagerVisitCard(v))
            )}
          </div>

          {/* Group 2: Tomorrow */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Tomorrow's Deployments ({managerData.grouped?.tomorrow?.length || 0})</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-blue-700">Departure Readiness</span>
            </h3>
            {(!managerData.grouped?.tomorrow || managerData.grouped?.tomorrow?.length === 0) ? (
              <p className="text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-gray-200">No field visits scheduled for tomorrow.</p>
            ) : (
              managerData.grouped?.tomorrow?.map((v: any) => renderManagerVisitCard(v))
            )}
          </div>

          {/* Group 3: Next 7 Days */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Next 7 Days Field Schedule ({managerData.grouped?.next_7_days?.length || 0})</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-indigo-700">Pre-Planned Horizon</span>
            </h3>
            {(!managerData.grouped?.next_7_days || managerData.grouped?.next_7_days?.length === 0) ? (
              <p className="text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-gray-200">No field visits scheduled for the next 7 days.</p>
            ) : (
              managerData.grouped?.next_7_days?.map((v: any) => renderManagerVisitCard(v))
            )}
          </div>

          {/* Group 4: Later / Future Deployments */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" />
                <span>Later & Long-Range Tour Programs ({managerData.grouped?.later?.length || 0})</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-purple-700">Future Calendar</span>
            </h3>
            {(!managerData.grouped?.later || managerData.grouped?.later?.length === 0) ? (
              <p className="text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-gray-200">No long-range visits scheduled beyond 7 days.</p>
            ) : (
              managerData.grouped?.later?.map((v: any) => renderManagerVisitCard(v))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TRIPS & MULTI-STOP PLANS */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#5871A5]">
              Multi-stop tour programs. Managers can optimize trips by adding adjacent client visits to save travel overhead.
            </p>
            <Button size="sm" onClick={() => setIsCreateTripOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>New Tour Program</span>
            </Button>
          </div>

          {trips.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
              No tour programs planned yet. Create one to organize multi-stop customer visits.
            </div>
          ) : (
            trips.map((t) => (
              <div key={t.id} className="p-5 bg-white border border-[#D6E3F5] rounded-xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">TRIP</Badge>
                      <span className="text-base font-bold text-[#1A1A1A]">
                        {t.base_location} Tour
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#5871A5]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(t.trip_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Officer: {t.employee_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasRole(['management', 'regional_manager', 'admin']) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTrip(t);
                          setTripVisit({
                            organisation_id: '',
                            location: t.base_location,
                            start_time: '14:00',
                            end_time: '15:30',
                            purpose: '',
                            instructions: '',
                            reason: 'Customer is in the same operational area',
                          });
                          setIsAddTripVisitOpen(true);
                        }}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                        <span>+ Add Customer Visit to Trip</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tree Structure of Visits */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#5871A5] uppercase tracking-wider block">
                    Planned Stop Itinerary ({t.visits?.length || 0} visits)
                  </span>

                  {(!t.visits || t.visits.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">No visits currently attached to this tour.</p>
                  ) : (
                    t.visits.map((tv: any, idx: number) => (
                      <div
                        key={tv.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-full bg-[#223FA7] text-white flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1A1A1A]">{tv.organisation_name}</span>
                              {tv.manager_assigned && (
                                <Badge variant="warning" size="sm" className="text-[9px] py-0">
                                  MANAGER DIRECTIVE
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[#5871A5] flex items-center gap-2 mt-0.5">
                              <span>{tv.location}</span>
                              <span>•</span>
                              <span>{tv.start_time ? `${tv.start_time} - ${tv.end_time || ''}` : 'Slot TBD'}</span>
                              {tv.purpose && <span>• Purpose: {tv.purpose}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(tv.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenAudit(tv)}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: CUSTOMER TIMELINE */}
      {activeTab === 'customer_history' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-[#D6E3F5] shadow-xs">
            <span className="text-xs font-bold text-gray-700 shrink-0">Select Customer / Agency:</span>
            <Select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              options={organisations.map((o) => ({ value: o.id, label: `${o.name} (${o.city || 'State'})` }))}
              className="max-w-md"
            />
          </div>

          <div className="space-y-3">
            {selectedOrgHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
                No past field visits or interactions recorded for this customer.
              </div>
            ) : (
              selectedOrgHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">VISIT RECORD</Badge>
                      <span className="text-xs font-bold text-gray-800">
                        {new Date(item.planned_date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="text-xs text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg">
                    <div>
                      <span className="font-semibold text-[#5871A5]">Officer Met:</span> {item.person_met || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold text-[#5871A5]">Field Staff:</span> {item.employee_name || 'Staff'}
                    </div>
                    <div>
                      <span className="font-semibold text-[#5871A5]">Outcome:</span> {item.post_visit_outcome || item.expected_outcome || 'N/A'}
                    </div>
                  </div>

                  {item.discussion && (
                    <p className="text-xs text-gray-700 pt-1">
                      <span className="font-bold text-[#5871A5]">Discussion Notes:</span> {item.discussion}
                    </p>
                  )}

                  {item.followup_date && (
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Follow-up Commitment: {new Date(item.followup_date).toLocaleDateString('en-IN')}
                      {item.next_action ? ` (${item.next_action})` : ''}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMPLOYEE ACTIVITY DOSSIER */}
      {activeTab === 'employee_activity' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#223FA7]">Field Performance & Activity Log</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological record of verified customer engagements and milestone follow-ups.</p>
          </div>

          <div className="space-y-3">
            {employeeActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
                No activity records logged yet. Completing field visits will automatically populate this dossier.
              </div>
            ) : (
              employeeActivities.map((act) => (
                <div key={act.id} className="p-4 bg-white border border-[#D6E3F5] rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1A1A1A]">{act.title}</span>
                    <Badge variant={act.status === 'completed' ? 'success' : 'default'} size="sm">
                      {act.status?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-[#5871A5] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(act.activity_date).toLocaleDateString('en-IN')}
                    </span>
                    {act.outcome && (
                      <span className="font-semibold text-emerald-800">
                        Outcome: {act.outcome}
                      </span>
                    )}
                  </div>

                  {act.next_action && (
                    <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <span className="font-bold">Next Action Commitment:</span> {act.next_action}
                      {act.followup_date && ` (By ${new Date(act.followup_date).toLocaleDateString('en-IN')})`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 1: PLAN CLIENT VISIT */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Plan Client Field Visit"
        description="Schedule upcoming procurement meetings and product demonstrations."
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleVisit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {actionError}
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-600" />
            <span>Standard operating procedure: Plan field visits approximately 1 week in advance.</span>
          </div>

          {/* Section 1: Customer Agency & Location */}
          <div className="space-y-3 p-3.5 bg-gray-50/70 rounded-xl border border-[#D6E3F5]">
            <span className="text-[11px] font-bold text-[#223FA7] uppercase tracking-wider block">
              1. Customer Agency & Location
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Organisation (Choose Agency)"
                value={newVisit.organisation_id}
                onChange={(e) => {
                  const orgId = e.target.value;
                  const org = organisations.find((o) => o.id === orgId);
                  setNewVisit({
                    ...newVisit,
                    organisation_id: orgId,
                    location: org?.city || newVisit.location,
                  });
                }}
                options={[
                  { value: '', label: '-- Choose Customer Agency --' },
                  ...organisations.map((o) => ({ value: o.id, label: `${o.name} (${o.city || 'State'})` })),
                ]}
              />

              <Input
                label="Or Enter New Agency Name"
                value={newVisit.organisation_name}
                onChange={(e) => setNewVisit({ ...newVisit, organisation_name: e.target.value })}
                placeholder="e.g. ITBP Sector HQ / Punjab Police"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Location / Station"
                required
                value={newVisit.location}
                onChange={(e) => setNewVisit({ ...newVisit, location: e.target.value })}
                placeholder="e.g. Jalandhar Cantonment / New Delhi"
              />

              <Input
                label="Contact Person (Officer / Authority)"
                value={newVisit.contact_person}
                onChange={(e) => setNewVisit({ ...newVisit, contact_person: e.target.value })}
                placeholder="e.g. Commandant Signals / DIG Procurement"
              />
            </div>
          </div>

          {/* Section 2: Date & Purpose */}
          <div className="space-y-3 p-3.5 bg-gray-50/70 rounded-xl border border-[#D6E3F5]">
            <span className="text-[11px] font-bold text-[#223FA7] uppercase tracking-wider block">
              2. Date, Time & Meeting Purpose
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Planned Date"
                type="date"
                required
                value={newVisit.planned_date}
                onChange={(e) => setNewVisit({ ...newVisit, planned_date: e.target.value })}
              />

              <Input
                label="Start Time"
                type="time"
                value={newVisit.start_time}
                onChange={(e) => setNewVisit({ ...newVisit, start_time: e.target.value })}
              />

              <Input
                label="End Time"
                type="time"
                value={newVisit.end_time}
                onChange={(e) => setNewVisit({ ...newVisit, end_time: e.target.value })}
              />
            </div>

            <Input
              label="Primary Purpose of Visit"
              required
              value={newVisit.purpose}
              onChange={(e) => setNewVisit({ ...newVisit, purpose: e.target.value })}
              placeholder="e.g. Technical demonstration of DFMD / HHMD for upcoming GeM procurement"
            />
          </div>

          {/* Section 3: Product Focus & Expected Outcome */}
          <div className="space-y-3 p-3.5 bg-gray-50/70 rounded-xl border border-[#D6E3F5]">
            <span className="text-[11px] font-bold text-[#223FA7] uppercase tracking-wider block">
              3. Product Focus & Strategic Outcome
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Primary Product Focus"
                value={newVisit.product_id}
                onChange={(e) => setNewVisit({ ...newVisit, product_id: e.target.value })}
                options={[
                  { value: '', label: '-- General / Portfolio Meeting --' },
                  ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.category || 'Security'})` })),
                ]}
              />

              <Input
                label="Expected Strategic Outcome"
                value={newVisit.expected_outcome}
                onChange={(e) => setNewVisit({ ...newVisit, expected_outcome: e.target.value })}
                placeholder="e.g. Secure trial evaluation certificate and quote RFP"
              />
            </div>
          </div>

          {/* Section 4: Travel, Demo Requirements & Remarks */}
          <div className="space-y-3 p-3.5 bg-gray-50/70 rounded-xl border border-[#D6E3F5]">
            <span className="text-[11px] font-bold text-[#223FA7] uppercase tracking-wider block">
              4. Travel, Demo & Remarks
            </span>
            <div className="flex flex-wrap items-center gap-6 p-3 bg-white rounded-lg border border-[#D6E3F5] text-xs font-semibold text-gray-700">
              <Checkbox
                checked={newVisit.travel_required}
                onChange={(e) => setNewVisit({ ...newVisit, travel_required: e.target.checked })}
                label="Travel Requirement (Outstation)"
              />

              <Checkbox
                checked={newVisit.demo_required}
                onChange={(e) => setNewVisit({ ...newVisit, demo_required: e.target.checked })}
                label="Demo Requirement (Live Trials)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Remarks & Operational Notes
              </label>
              <textarea
                value={newVisit.remarks}
                onChange={(e) => setNewVisit({ ...newVisit, remarks: e.target.value })}
                placeholder="e.g. Officer requested technical compliance sheets; gate pass required for vehicle."
                rows={2}
                className="flex w-full rounded-lg border border-[#D6E3F5] bg-white px-3.5 py-2 text-xs font-normal text-[#1A1A1A] placeholder:text-gray-400 transition-colors focus:border-[#3770E3] focus:outline-none focus:ring-2 focus:ring-[#3770E3]/15"
              />
            </div>

            {trips.length > 0 && (
              <Select
                label="Attach to Existing Tour Program (Optional)"
                value={newVisit.trip_id}
                onChange={(e) => setNewVisit({ ...newVisit, trip_id: e.target.value })}
                options={[
                  { value: '', label: '-- Standalone Field Visit --' },
                  ...trips.map((t) => ({ value: t.id, label: `${t.base_location} Tour (${new Date(t.trip_date).toLocaleDateString('en-IN')})` })),
                ]}
              />
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Schedule Visit
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 2: CREATE TOUR PROGRAM (TRIP) */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        title="Create Field Tour Program (Trip)"
        description="Establish an operational tour encompassing multiple client agency visits."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          {hasRole(['management', 'regional_manager', 'admin']) && (
            <Select
              label="Assigned Sales Executive"
              value={newTrip.employee_id}
              onChange={(e) => setNewTrip({ ...newTrip, employee_id: e.target.value })}
              options={[
                { value: '', label: '-- Assign to Self / Current User --' },
                ...usersList.map((u) => ({ value: u.id, label: `${u.full_name} (${u.role})` })),
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Destination / City"
              required
              value={newTrip.base_location}
              onChange={(e) => setNewTrip({ ...newTrip, base_location: e.target.value })}
              placeholder="e.g. Chandigarh / Jammu"
            />

            <Input
              label="Trip Date"
              type="date"
              required
              value={newTrip.trip_date}
              onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })}
            />
          </div>

          <Input
            label="Tour Mission Notes"
            value={newTrip.notes}
            onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
            placeholder="e.g. 2-day sector review with BSF Punjab Frontier & State Police Wireless"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateTripOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Establish Tour Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 3: MANAGER ADD VISIT TO TRIP (OPTIMIZATION) */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isAddTripVisitOpen}
        onClose={() => setIsAddTripVisitOpen(false)}
        title="Trip Optimization: Add Customer to Itinerary"
        description={`Add an adjacent client meeting to ${selectedTrip?.employee_name || 'employee'}'s trip to maximize travel efficiency.`}
        maxWidth="md"
      >
        <form onSubmit={handleAddTripVisit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <span className="font-bold block">Base Station: {selectedTrip?.base_location}</span>
            <span>Visits in this tour program should be reasonably close to avoid travel schedule conflict.</span>
          </div>

          <Select
            label="Select Additional Client Agency"
            required
            value={tripVisit.organisation_id}
            onChange={(e) => {
              const org = organisations.find((o) => o.id === e.target.value);
              setTripVisit({
                ...tripVisit,
                organisation_id: e.target.value,
                location: org?.city || tripVisit.location,
              });
            }}
            options={[
              { value: '', label: '-- Choose Agency in Same Area --' },
              ...organisations.map((o) => ({ value: o.id, label: `${o.name} (${o.city || 'State'})` })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Station / Address"
              value={tripVisit.location}
              onChange={(e) => setTripVisit({ ...tripVisit, location: e.target.value })}
              placeholder="e.g. Chandigarh Sector 17"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <Input
                label="Start"
                type="time"
                value={tripVisit.start_time}
                onChange={(e) => setTripVisit({ ...tripVisit, start_time: e.target.value })}
              />
              <Input
                label="End"
                type="time"
                value={tripVisit.end_time}
                onChange={(e) => setTripVisit({ ...tripVisit, end_time: e.target.value })}
              />
            </div>
          </div>

          <Input
            label="Purpose of This Meeting"
            value={tripVisit.purpose}
            onChange={(e) => setTripVisit({ ...tripVisit, purpose: e.target.value })}
            placeholder="e.g. Introduce Vehicle Surveillance System"
          />

          <Input
            label="Manager Directive / Instructions for Officer"
            required
            value={tripVisit.instructions}
            onChange={(e) => setTripVisit({ ...tripVisit, instructions: e.target.value })}
            placeholder="e.g. Also meet DIG Logistics to follow up on the upcoming GeM bid."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddTripVisitOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Add to Itinerary
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 4: ALSO-MEET DIRECTIVE */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isAlsoMeetOpen}
        onClose={() => setIsAlsoMeetOpen(false)}
        title="Manager 'Also-Meet' Strategic Directive"
        description="Instruct the visiting sales executive to meet additional procurement officers while in the area."
        maxWidth="md"
      >
        <form onSubmit={handleAlsoMeetSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Manager Directive & Contact Details"
            required
            value={alsoMeetNotes}
            onChange={(e) => setAlsoMeetNotes(e.target.value)}
            placeholder="e.g. Also meet SP Provisioning regarding pending AMC contract before GeM tender closes."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAlsoMeetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Directive
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 5: RESCHEDULE VISIT */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Client Field Visit"
        description="Postpone or advance the visit. A reason is strictly mandatory and will be recorded in the audit trail."
        maxWidth="md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Planned Date"
              type="date"
              required
              value={rescheduleData.new_date}
              onChange={(e) => setRescheduleData({ ...rescheduleData, new_date: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-1.5">
              <Input
                label="Start Time"
                type="time"
                value={rescheduleData.start_time}
                onChange={(e) => setRescheduleData({ ...rescheduleData, start_time: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={rescheduleData.end_time}
                onChange={(e) => setRescheduleData({ ...rescheduleData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mandatory Rescheduling Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rescheduleData.reason}
              onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
              placeholder="e.g. Customer requested postponement due to VIP convoy duty."
              className="w-full text-xs p-2.5 rounded-lg border border-[#D6E3F5] focus:ring-1 focus:ring-[#3770E3] focus:border-[#3770E3]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 6: CANCEL VISIT */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Client Field Visit"
        description="Cancelling will alert the regional manager and create an append-only audit record."
        maxWidth="md"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Field trial cancelled by Ministry due to weather."
              className="w-full text-xs p-2.5 rounded-lg border border-[#D6E3F5] focus:ring-1 focus:ring-[#3770E3] focus:border-[#3770E3]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCancelOpen(false)}>
              Back
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 7: CHANGE DESTINATION */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isDestinationOpen}
        onClose={() => setIsDestinationOpen(false)}
        title="Change Visit Destination"
        description="Update the meeting station or venue. Audit logs will record both prior and new locations."
        maxWidth="md"
      >
        <form onSubmit={handleDestinationSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="New Location / Testing Ground"
            required
            value={newDestination.new_location}
            onChange={(e) => setNewDestination({ ...newDestination, new_location: e.target.value })}
            placeholder="e.g. Delhi Frontier Testing Range"
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Reason for Venue Change <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={newDestination.reason}
              onChange={(e) => setNewDestination({ ...newDestination, reason: e.target.value })}
              placeholder="e.g. Demonstrations moved to outdoor proving range by DIG technical."
              className="w-full text-xs p-2.5 rounded-lg border border-[#D6E3F5] focus:ring-1 focus:ring-[#3770E3] focus:border-[#3770E3]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsDestinationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Update Station
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 8: POST-VISIT REPORT */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Submit Post-Visit Outcome Report"
        description="Record intelligence, officer feedback, and follow-up milestones."
        maxWidth="lg"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {actionError}
            </div>
          )}

          {/* Meeting Status Toggle */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Did the meeting take place?</label>
            <div className="flex items-center gap-6 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800">
                <input
                  type="radio"
                  name="met_completed"
                  checked={reportData.met_completed === true}
                  onChange={() => setReportData({ ...reportData, met_completed: true })}
                />
                <span>Yes — Meeting Completed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-800">
                <input
                  type="radio"
                  name="met_completed"
                  checked={reportData.met_completed === false}
                  onChange={() => setReportData({ ...reportData, met_completed: false })}
                />
                <span>No — Not Completed / Customer Unavailable</span>
              </label>
            </div>
          </div>

          {reportData.met_completed ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Person Met (Name & Rank / Designation)"
                  required
                  value={reportData.person_met}
                  onChange={(e) => setReportData({ ...reportData, person_met: e.target.value })}
                  placeholder="e.g. Dr. A.K. Sharma, DIG Procurement"
                />

                <Input
                  label="Product Discussed"
                  value={reportData.product_discussed}
                  onChange={(e) => setReportData({ ...reportData, product_discussed: e.target.value })}
                  placeholder="e.g. HHMD MHA QR Specification"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Discussion Summary & Technical Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reportData.discussion}
                  onChange={(e) => setReportData({ ...reportData, discussion: e.target.value })}
                  placeholder="Points discussed, customer reactions, technical clarifications requested..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D6E3F5] focus:ring-1 focus:ring-[#3770E3] focus:border-[#3770E3]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Meeting Outcome"
                  required
                  value={reportData.outcome}
                  onChange={(e) => setReportData({ ...reportData, outcome: e.target.value })}
                  placeholder="e.g. Trial requested / Positive technical feedback"
                />

                <Input
                  label="Opportunity Identified"
                  value={reportData.opportunity}
                  onChange={(e) => setReportData({ ...reportData, opportunity: e.target.value })}
                  placeholder="e.g. Estimated 100 units tender in Q3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Next Action Commitment"
                  value={reportData.next_action}
                  onChange={(e) => setReportData({ ...reportData, next_action: e.target.value })}
                  placeholder="e.g. Dispatch demo unit from Delhi Depot"
                />

                <Input
                  label="Follow-Up Milestone Date"
                  type="date"
                  value={reportData.followup_date}
                  onChange={(e) => setReportData({ ...reportData, followup_date: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason Why Meeting Did Not Take Place <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reportData.remarks}
                onChange={(e) => setReportData({ ...reportData, remarks: e.target.value })}
                placeholder="e.g. Officer was summoned urgently for VIP convoy movement."
                className="w-full text-xs p-2.5 rounded-lg border border-[#D6E3F5] focus:ring-1 focus:ring-[#3770E3] focus:border-[#3770E3]"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Submit Intelligence
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 9: VISIT AUDIT TRAIL */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        title="Immutable Visit Audit Trail"
        description={`Audit history for visit to ${selectedVisit?.organisation_name || 'agency'}.`}
        maxWidth="md"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-4 text-center">No audit records found.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#223FA7]">{log.action}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold text-gray-600">Actor:</span> {log.actor_name || 'System'} ({log.actor_role})
                </div>
                {log.new_value?.reason && (
                  <div className="text-gray-600 italic">
                    Reason: "{log.new_value.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </PageContainer>
  );
}
