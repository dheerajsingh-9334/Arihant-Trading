'use client';

import React, { useState, useEffect } from 'react';
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
  FilterBar,
} from '@/components/ui';
import { formatINR } from '@arihant/shared';

export default function TendersPage() {
  const { user, hasRole } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [tenders, setTenders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);

  // Modals & Selected Item
  const [selectedTender, setSelectedTender] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected'>('approved');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [outcomeResult, setOutcomeResult] = useState<'won' | 'lost'>('won');
  const [outcomeReason, setOutcomeReason] = useState('');
  const [outcomeCompetitor, setOutcomeCompetitor] = useState('');
  const [outcomeValueLakh, setOutcomeValueLakh] = useState('');

  // Create form
  const [newTender, setNewTender] = useState({
    tender_no: '',
    portal: 'GeM',
    department: '',
    city: '',
    state: '',
    category: 'general_mha',
    requirement_text: '',
    quantity: 1,
    emd_fee: 0,
    bid_start_date: new Date().toISOString().split('T')[0],
    bid_closing_date: '',
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/tenders', {
        search,
        status: statusFilter,
        category: categoryFilter,
        closingSoonOnly: closingSoonOnly ? 'true' : undefined,
        limit: 50,
      });

      setTenders(res.data || []);
      setTotalCount(res.total || 0);

      // Auto-open highlight if present
      if (highlightId && res.data) {
        const found = res.data.find((t: any) => t.id === highlightId);
        if (found) {
          setSelectedTender(found);
          setIsDetailOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [search, statusFilter, categoryFilter, closingSoonOnly]);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/tenders/${selectedTender.id}/approve`, {
        decision: approvalDecision,
        remarks: approvalRemarks,
      });

      setIsApproveOpen(false);
      setIsDetailOpen(false);
      setApprovalRemarks('');
      await fetchTenders();
    } catch (err: any) {
      setActionError(err.message || 'Approval action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/tenders/${selectedTender.id}/outcome`, {
        result: outcomeResult,
        reason: outcomeReason,
        competitor: outcomeCompetitor,
        value_lakh: outcomeValueLakh ? Number(outcomeValueLakh) : undefined,
      });

      setIsOutcomeOpen(false);
      setIsDetailOpen(false);
      setOutcomeReason('');
      setOutcomeCompetitor('');
      setOutcomeValueLakh('');
      await fetchTenders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record tender outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkSubmitted = async () => {
    if (!selectedTender) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await api.patch(`/tenders/${selectedTender.id}/status`, {
        status: 'submitted',
        remarks: `Bid submitted on portal by ${user?.full_name || 'Tender Team'}`,
      });
      setIsDetailOpen(false);
      await fetchTenders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update tender status to submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post('/tenders', {
        ...newTender,
        quantity: Number(newTender.quantity) || 1,
        emd_fee: Number(newTender.emd_fee) || 0,
      });

      setIsCreateOpen(false);
      setNewTender({
        tender_no: '',
        portal: 'GeM',
        department: '',
        city: '',
        state: '',
        category: 'general_mha',
        requirement_text: '',
        quantity: 1,
        emd_fee: 0,
        bid_start_date: new Date().toISOString().split('T')[0],
        bid_closing_date: '',
      });
      await fetchTenders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create tender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#223FA7]" />
            <span>GeM Defence Tenders Pipeline</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Tracking {totalCount} live government bids from North Live Tender Sheet FY 2026-27.
          </p>
        </div>

        {hasRole(['management', 'regional_manager', 'tender_team', 'admin']) && (
          <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add GeM Tender</span>
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <FilterBar>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#5871A5] z-10" />
            <Input
              type="text"
              placeholder="Search tender no, requirement, buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10"
          >
            <option value="">All Bid Statuses</option>
            <option value="under_preparation">Under Preparation</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="submitted">Submitted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>

          {/* Category filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10"
          >
            <option value="">All Categories</option>
            <option value="general_mha">General MHA</option>
            <option value="pq">Pre-Qualification (PQ)</option>
            <option value="other">Other Defence/Govt</option>
          </Select>

          {/* Closing soon quick toggle */}
          <Button
            type="button"
            variant={closingSoonOnly ? 'danger' : 'outline'}
            onClick={() => setClosingSoonOnly(!closingSoonOnly)}
            leftIcon={<Clock className="h-3.5 w-3.5" />}
            size="md"
            className="h-10 w-full"
          >
            <span>Closing ≤ 7d Only</span>
          </Button>
        </div>
      </FilterBar>

      {/* Tenders Table */}
      <div className="rounded-xl border border-[#D6E3F5] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7FBFF] border-b border-[#D6E3F5] text-[11px] uppercase tracking-wider text-[#5871A5] font-bold">
              <tr>
                <th className="p-3.5">Tender Reference No.</th>
                <th className="p-3.5">Department / Location</th>
                <th className="p-3.5">Equipment Requirement</th>
                <th className="p-3.5">Qty / EMD</th>
                <th className="p-3.5">Bid Closing Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E3F5]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#5871A5]">
                    Loading tenders database...
                  </td>
                </tr>
              ) : tenders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#5871A5]">
                    No matching tenders found with current filters.
                  </td>
                </tr>
              ) : (
                tenders.map((tender) => {
                  const closingDate = tender.bid_closing_date
                    ? new Date(tender.bid_closing_date)
                    : null;
                  const today = new Date();
                  const diffDays = closingDate
                    ? Math.ceil(
                        (closingDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 999;
                  const isUrgent = diffDays <= 7 && tender.status !== 'won' && tender.status !== 'lost';

                  return (
                    <tr
                      key={tender.id}
                      className={`transition-colors hover:bg-[#F7FBFF] ${
                        isUrgent ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Tender ID */}
                      <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#223FA7]">{tender.tender_no}</span>
                          {isUrgent && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#5871A5] font-mono">
                          {tender.portal} &bull; {tender.category?.toUpperCase()}
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="p-3.5 text-[#1A1A1A] max-w-[200px] truncate">
                        <div className="font-semibold text-[#1A1A1A] truncate">
                          {tender.department || tender.organisation_name || 'Government Buyer'}
                        </div>
                        <div className="text-[10px] text-[#5871A5] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {tender.city}, {tender.state}
                          </span>
                        </div>
                      </td>

                      {/* Requirement */}
                      <td className="p-3.5 text-gray-700 max-w-[240px] truncate">
                        <div className="truncate font-medium text-[#1A1A1A]">
                          {tender.requirement_text}
                        </div>
                        <div className="text-[10px] text-[#5871A5] truncate">
                          Zone: {tender.zone_name || 'North'} &bull; Owner:{' '}
                          {tender.owner_name || 'Assigned'}
                        </div>
                      </td>

                      {/* Qty & EMD */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#1A1A1A]">
                          Qty: {tender.quantity || 1}
                        </div>
                        <div className="text-[10px] text-[#5871A5] font-mono">
                          EMD: {tender.emd_fee ? formatINR(tender.emd_fee) : 'Exempt'}
                        </div>
                      </td>

                      {/* Closing Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono text-gray-700 font-medium">
                          {closingDate ? closingDate.toLocaleDateString('en-IN') : 'TBA'}
                        </div>
                        {isUrgent && (
                          <Badge variant="urgent" size="sm" className="mt-1">
                            {diffDays <= 0 ? 'CLOSING TODAY' : `${diffDays} DAYS LEFT`}
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            tender.status === 'won'
                              ? 'success'
                              : tender.status === 'lost'
                              ? 'danger'
                              : tender.status === 'under_preparation'
                              ? 'info'
                              : tender.status === 'awaiting_approval'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {tender.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedTender(tender);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
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
      </div>

      {/* Tender Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedTender?.tender_no || 'Tender Specifications'}
        description={`Published on ${selectedTender?.portal || 'GeM'} • Department: ${selectedTender?.department || 'Government Buyer'}`}
        maxWidth="2xl"
      >
        {selectedTender && (
          <div className="space-y-6 text-xs">
            {/* Urgent deadline callout */}
            {selectedTender.bid_closing_date && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock className="h-4 w-4 text-red-600 animate-pulse" />
                  <div>
                    <span className="font-bold text-red-900">Bid Closing Deadline: </span>
                    <span className="font-mono text-red-700">
                      {new Date(selectedTender.bid_closing_date).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <Badge variant="urgent" size="sm">
                  CRITICAL MILESTONE
                </Badge>
              </div>
            )}

            {/* Spec Details Grid */}
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
                <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Bidder Turnover</span>
                <span className="font-semibold text-gray-700">
                  {selectedTender.bidder_turnover || 'As per GeM QR'}
                </span>
              </div>
              <div>
                <span className="text-[#5871A5] block text-[10px] uppercase font-bold">OEM Turnover</span>
                <span className="font-semibold text-gray-700">
                  {selectedTender.oem_turnover || 'As per GeM QR'}
                </span>
              </div>
              <div>
                <span className="text-[#5871A5] block text-[10px] uppercase font-bold">Current Status</span>
                <Badge variant="warning" size="sm" className="mt-1">
                  {selectedTender.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Full Requirement Text */}
            <div>
              <h4 className="font-bold text-[#1A1A1A] mb-1.5 uppercase text-[11px]">
                Specification Requirement Details
              </h4>
              <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-gray-800 leading-relaxed font-mono text-[11px]">
                {selectedTender.requirement_text}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#D6E3F5] flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-[#5871A5]">
                Tender Owner: <strong className="text-[#1A1A1A]">{selectedTender.owner_name || 'Self'}</strong>
              </div>

              <div className="flex items-center gap-2">
                {/* Management / RM Participation Approval with Non-Self-Approval Guard */}
                {hasRole(['management', 'regional_manager']) &&
                  (selectedTender.status === 'awaiting_approval' || selectedTender.status === 'under_preparation') && (
                    user?.id === selectedTender.tender_owner_id ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium" title="Dual-control policy: The creator cannot approve their own tender.">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Self-Approval Prohibited (Independent Review Required)</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsApproveOpen(true)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        <span>Participation Signoff</span>
                      </Button>
                    )
                  )}

                {/* Tender Team Advances Bid to Submitted */}
                {hasRole(['management', 'regional_manager', 'tender_team', 'admin']) &&
                  selectedTender.status === 'under_preparation' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleMarkSubmitted}
                      isLoading={isSubmitting}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      <span>Mark Bid as Submitted</span>
                    </Button>
                  )}

                {/* Record Final Outcome (Won/Lost) - allowed on submitted bids */}
                {hasRole(['management', 'tender_team', 'admin']) &&
                  (selectedTender.status === 'submitted' || selectedTender.status === 'under_preparation') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsOutcomeOpen(true)}
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />
                      <span>Record Won / Lost</span>
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Participation Approval Modal */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Management Tender Decision"
        description="Verify financial commitments, EMD requirements, and technical compliance before committing."
        maxWidth="md"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Select
            label="Decision"
            value={approvalDecision}
            onChange={(e) => setApprovalDecision(e.target.value as any)}
            options={[
              { value: 'approved', label: 'APPROVE - Proceed with Bid Preparation' },
              { value: 'rejected', label: 'REJECT - Drop Tender (Do Not Participate)' },
            ]}
          />

          <Input
            label="Management Remarks & Directives"
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
              Commit Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tender Outcome Modal */}
      <Modal
        isOpen={isOutcomeOpen}
        onClose={() => setIsOutcomeOpen(false)}
        title="Record Final Bid Outcome"
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
            label="Bid Result"
            value={outcomeResult}
            onChange={(e) => setOutcomeResult(e.target.value as any)}
            options={[
              { value: 'won', label: 'WON - Order Awarded to Arihant' },
              { value: 'lost', label: 'LOST - Awarded to Competitor or Disqualified' },
            ]}
          />

          <Input
            label="Outcome Reason / Analysis"
            value={outcomeReason}
            onChange={(e) => setOutcomeReason(e.target.value)}
            placeholder="e.g. L1 quoted ₹ 14.2 Lakh vs our ₹ 15.8 Lakh, or L1 Price Match"
            required
          />

          <Input
            label="Winning Bidder / Competitor"
            value={outcomeCompetitor}
            onChange={(e) => setOutcomeCompetitor(e.target.value)}
            placeholder="e.g. Falcon Security / BEL / Godrej"
          />

          <Input
            label="Final Contract Value (₹ Lakh)"
            type="number"
            step="0.01"
            value={outcomeValueLakh}
            onChange={(e) => setOutcomeValueLakh(e.target.value)}
            placeholder="e.g. 18.5"
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
              Save Final Outcome
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Tender Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New GeM Tender"
        description="Add a tender requirement to the central operational pipeline."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GeM Bid / Tender No."
              required
              value={newTender.tender_no}
              onChange={(e) => setNewTender({ ...newTender, tender_no: e.target.value })}
              placeholder="GEM/2026/B/982312"
            />
            <Input
              label="Department / Ministry"
              required
              value={newTender.department}
              onChange={(e) => setNewTender({ ...newTender, department: e.target.value })}
              placeholder="CRPF / CISF / BSF"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              required
              value={newTender.city}
              onChange={(e) => setNewTender({ ...newTender, city: e.target.value })}
              placeholder="New Delhi"
            />
            <Input
              label="State"
              required
              value={newTender.state}
              onChange={(e) => setNewTender({ ...newTender, state: e.target.value })}
              placeholder="Delhi"
            />
            <Select
              label="Category"
              value={newTender.category}
              onChange={(e) => setNewTender({ ...newTender, category: e.target.value })}
              options={[
                { value: 'general_mha', label: 'General MHA' },
                { value: 'pq', label: 'Pre-Qualification (PQ)' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <Input
            label="Product Requirement Description"
            required
            value={newTender.requirement_text}
            onChange={(e) => setNewTender({ ...newTender, requirement_text: e.target.value })}
            placeholder="e.g. Passive Night Vision Monocular as per MHA QR"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              value={newTender.emd_fee}
              onChange={(e) => setNewTender({ ...newTender, emd_fee: Number(e.target.value) })}
            />
            <Input
              label="Bid Closing Date"
              type="date"
              required
              value={newTender.bid_closing_date}
              onChange={(e) => setNewTender({ ...newTender, bid_closing_date: e.target.value })}
            />
          </div>

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
              Register Tender
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
