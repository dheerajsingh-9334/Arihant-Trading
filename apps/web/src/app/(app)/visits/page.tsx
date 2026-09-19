'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Receipt,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function VisitsPage() {
  const { user, hasRole } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAlsoMeetOpen, setIsAlsoMeetOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  // Also meet form
  const [alsoMeetNotes, setAlsoMeetNotes] = useState('');

  // Report form
  const [reportOutcome, setReportOutcome] = useState<'successful' | 'follow_up_needed' | 'dropped'>('successful');
  const [reportNotes, setReportNotes] = useState('');
  const [reportNextFollowUp, setReportNextFollowUp] = useState('');

  // Schedule visit form
  const [newVisit, setNewVisit] = useState({
    organisation_name: '',
    department: '',
    location: '',
    planned_date: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchVisits = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/visits', { limit: 50 });
      setVisits(res.data || []);
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      const orgRes = await api.post('/organisations', {
        name: newVisit.organisation_name,
        department: newVisit.department,
        city: newVisit.location || 'Delhi',
        state: 'North',
      });

      await api.post('/visits', {
        organisation_id: orgRes.id,
        location: newVisit.location,
        planned_date: newVisit.planned_date,
        purpose: newVisit.purpose,
        notes: newVisit.notes,
      });

      setIsScheduleOpen(false);
      setNewVisit({
        organisation_name: '',
        department: '',
        location: '',
        planned_date: new Date().toISOString().split('T')[0],
        purpose: '',
        notes: '',
      });
      await fetchVisits();
    } catch (err: any) {
      setActionError(err.message || 'Failed to schedule visit.');
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
      await fetchVisits();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add manager also-meet note.');
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
        met_completed: true,
        outcome: reportOutcome,
        discussion: reportNotes,
        next_action: reportNextFollowUp ? `Follow-up on ${reportNextFollowUp}` : undefined,
        followup_date: reportNextFollowUp || undefined,
      });

      setIsReportOpen(false);
      setReportNotes('');
      setReportNextFollowUp('');
      await fetchVisits();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit visit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#223FA7]" />
            <span>Field Client Visits & Travel Planner</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Weekly tour programs, post-visit reports, and regional manager "Also-Meet" strategic directives.
          </p>
        </div>

        <Button onClick={() => setIsScheduleOpen(true)} variant="primary" className="shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Plan Client Tour</span>
        </Button>
      </div>

      {/* Visits List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
            Loading visit schedules...
          </div>
        ) : visits.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
            No visits currently scheduled.
          </div>
        ) : (
          visits.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-xl border border-[#D6E3F5] bg-white hover:border-[#3770E3] transition-all space-y-4 shadow-xs"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        v.status === 'completed'
                          ? 'success'
                          : v.status === 'cancelled'
                          ? 'danger'
                          : 'info'
                      }
                      size="sm"
                    >
                      {v.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {v.organisation_name || 'Client Agency'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5871A5]">
                    <span className="flex items-center gap-1 text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-[#223FA7]" />
                      {v.location || 'Site Location'}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-gray-700">
                      <Clock className="h-3.5 w-3.5 text-[#5871A5]" />
                      Date: {new Date(v.planned_date).toLocaleDateString('en-IN')}
                    </span>
                    <span className="flex items-center gap-1 text-[#5871A5]">
                      <User className="h-3.5 w-3.5 text-[#5871A5]" />
                      Officer: {v.user_name || 'Sales Staff'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 pt-1 font-medium">
                    Purpose: {v.purpose}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Manager Also-Meet Intervention */}
                  {hasRole(['management', 'regional_manager']) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVisit(v);
                        setAlsoMeetNotes(v.also_meet_notes || '');
                        setIsAlsoMeetOpen(true);
                      }}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      <span>{v.also_meet_notes ? 'Edit Also-Meet' : '+ Also-Meet Directive'}</span>
                    </Button>
                  )}

                  {/* Post-Visit Update */}
                  {v.status === 'planned' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedVisit(v);
                        setIsReportOpen(true);
                      }}
                    >
                      <FileEdit className="h-3.5 w-3.5 mr-1" />
                      <span>Submit Report</span>
                    </Button>
                  )}

                  {/* Claim Expense for this visit */}
                  <Link href={`/expenses?visit_id=${v.id}`}>
                    <Button size="sm" variant="ghost" className="text-[#223FA7]">
                      <Receipt className="h-3.5 w-3.5 mr-1 text-[#5871A5]" />
                      <span>Claim Expense</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Manager "Also-Meet" Banner Callout */}
              {v.also_meet_notes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3 shadow-xs">
                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-800 uppercase tracking-wider block text-[10px]">
                      REGIONAL MANAGER "ALSO-MEET" DIRECTIVE:
                    </span>
                    <p className="mt-0.5 font-medium leading-relaxed">{v.also_meet_notes}</p>
                  </div>
                </div>
              )}

              {/* Completed Report Callout */}
              {v.outcome_notes && (
                <div className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-xs text-gray-800 flex items-start space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#5871A5] uppercase tracking-wider block text-[10px]">
                      POST-VISIT REPORT ({v.outcome?.toUpperCase()}):
                    </span>
                    <p className="mt-0.5 leading-relaxed">{v.outcome_notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Schedule Tour Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Client Tour / Field Visit"
        description="Plan visits to headquarters, procurement branches, or test ranges."
        maxWidth="md"
      >
        <form onSubmit={handleScheduleVisit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Organisation / Agency"
            required
            value={newVisit.organisation_name}
            onChange={(e) => setNewVisit({ ...newVisit, organisation_name: e.target.value })}
            placeholder="e.g. ITBP Headquarters / Punjab Police"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location / Station"
              required
              value={newVisit.location}
              onChange={(e) => setNewVisit({ ...newVisit, location: e.target.value })}
              placeholder="e.g. Chandigarh"
            />
            <Input
              label="Planned Date"
              type="date"
              required
              value={newVisit.planned_date}
              onChange={(e) => setNewVisit({ ...newVisit, planned_date: e.target.value })}
            />
          </div>

          <Input
            label="Primary Purpose of Visit"
            required
            value={newVisit.purpose}
            onChange={(e) => setNewVisit({ ...newVisit, purpose: e.target.value })}
            placeholder="e.g. Technical demonstration of Passive Night Vision Monoculars"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Schedule Tour
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manager Also-Meet Modal */}
      <Modal
        isOpen={isAlsoMeetOpen}
        onClose={() => setIsAlsoMeetOpen(false)}
        title="Manager Also-Meet Directive"
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
            placeholder="e.g. While in Chandigarh, also visit SP Provisioning (Sh. Sharma) to introduce our Crash Rated Bollards before the upcoming GeM bid."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAlsoMeetOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Directive
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post-Visit Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Submit Post-Visit Report"
        description="Record findings, client feedback, and follow-up commitments."
        maxWidth="md"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Select
            label="Tour Outcome"
            value={reportOutcome}
            onChange={(e) => setReportOutcome(e.target.value as any)}
            options={[
              { value: 'successful', label: 'Successful - Strong Procurement Interest' },
              { value: 'follow_up_needed', label: 'Follow-Up Needed - Additional Info Requested' },
              { value: 'dropped', label: 'Dropped - No Active Requirement' },
            ]}
          />

          <Input
            label="Discussion Notes & Customer Feedback"
            required
            value={reportNotes}
            onChange={(e) => setReportNotes(e.target.value)}
            placeholder="Key discussion points, officers met, technical questions asked, next steps..."
          />

          <Input
            label="Next Follow-Up Date"
            type="date"
            value={reportNextFollowUp}
            onChange={(e) => setReportNextFollowUp(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReportOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
