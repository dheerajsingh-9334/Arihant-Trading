'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';

export default function DemosPage() {
  const { user, hasRole } = useAuth();
  const [demos, setDemos] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipment');

  // Modals
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<any | null>(null);

  // Reserve form
  const [newReserve, setNewReserve] = useState({
    demo_equipment_id: '',
    organisation_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    location: '',
    purpose: '',
  });

  // Outcome / Failure analysis form
  const [outcomeStatus, setOutcomeStatus] = useState<'successful' | 'failed' | 'partial'>('successful');
  const [failureReason, setFailureReason] = useState('');
  const [clientFeedback, setClientFeedback] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDemosData = async () => {
    try {
      setIsLoading(true);
      const [demosRes, equipRes] = await Promise.all([
        api.get('/demos', { limit: 50 }),
        api.get('/demos/equipment'),
      ]);

      setDemos(demosRes.data || []);
      setEquipmentList(equipRes || []);
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemosData();
  }, []);

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      const orgRes = await api.post('/organisations', {
        name: newReserve.organisation_name || 'Defence Procurement Client',
        city: newReserve.location || 'Delhi',
        state: 'North',
      });

      const demo = await api.post('/demos', {
        organisation_id: orgRes.id,
        location: newReserve.location,
        requested_date: newReserve.scheduled_date,
        expected_audience: newReserve.purpose,
        equipment_required: newReserve.purpose,
      });

      if (newReserve.demo_equipment_id) {
        await api.post(`/demos/${demo.id}/reserve`, {
          equipment_id: newReserve.demo_equipment_id,
          reserved_from: newReserve.scheduled_date,
          reserved_to: newReserve.scheduled_date,
        });
      }

      setIsReserveOpen(false);
      setNewReserve({
        demo_equipment_id: '',
        organisation_name: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        location: '',
        purpose: '',
      });
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to request equipment reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemo) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/demos/${selectedDemo.id}/outcome`, {
        result: outcomeStatus === 'failed' ? 'fail' : 'success',
        failure_reason: outcomeStatus === 'failed' ? failureReason : undefined,
        customer_response: clientFeedback,
        technical_performance: outcomeStatus === 'successful' ? 'Operational specs verified under field conditions' : 'Deficiency observed during firing trials',
        completed: true,
      });

      setIsOutcomeOpen(false);
      setFailureReason('');
      setClientFeedback('');
      await fetchDemosData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record demo outcome.');
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
            <Box className="h-6 w-6 text-[#223FA7]" />
            <span>Demo Equipment & Field Trials</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Tracking demo fleet allocation across Patna, Delhi, and Kolkata depots, reservations, and failure analyses.
          </p>
        </div>

        <Button
          onClick={() => setIsReserveOpen(true)}
          variant="primary"
          className="shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Request Equipment Demo</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'equipment', label: 'Depot Fleet Inventory Matrix', count: equipmentList.length },
          { id: 'schedule', label: 'Active Demo Pipeline', count: demos.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Equipment Fleet Matrix */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentList.map((eq) => {
            const status = eq.availability_status || eq.status || 'available';
            const location = eq.current_location || eq.depot_location || 'North Depot';

            return (
              <div
                key={eq.id}
                className="p-5 rounded-xl border border-[#D6E3F5] bg-white flex flex-col justify-between space-y-4 shadow-xs hover:border-[#3770E3] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#1A1A1A] leading-tight block">
                        {eq.product_name || eq.model || 'Equipment Unit'}
                      </span>
                      <span className="text-[10px] text-[#5871A5] font-mono">
                        S/N: {eq.serial_no}
                      </span>
                    </div>
                    <Badge
                      variant={
                        status === 'available'
                          ? 'success'
                          : status === 'reserved' || status === 'deployed'
                          ? 'info'
                          : status === 'in_transit'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center space-x-2 text-xs text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-[#223FA7]" />
                    <span className="font-semibold">{location} Depot</span>
                    <span className="text-[#5871A5]">({eq.model || 'Field Kit'})</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D6E3F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#5871A5]">
                    Condition: <strong className="text-[#1A1A1A]">{eq.condition || 'Operational'}</strong>
                  </span>
                  {status === 'available' && hasRole(['management', 'regional_manager', 'demo_team', 'admin']) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setNewReserve({ ...newReserve, demo_equipment_id: eq.id });
                        setIsReserveOpen(true);
                      }}
                    >
                      <span>Reserve Unit</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Demos Schedule & Approval Pipeline */}
      {activeTab === 'schedule' && (
        <div className="space-y-3.5">
          {demos.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-xl border border-[#D6E3F5] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      d.status === 'completed'
                        ? 'success'
                        : d.status === 'cancelled'
                        ? 'danger'
                        : d.status === 'equipment_reserved'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {d.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {d.organisation_name || d.equipment_name || 'Client Field Trial'}
                  </span>
                  {d.serial_no && <span className="text-xs text-[#5871A5]">({d.serial_no})</span>}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 text-xs text-[#5871A5]">
                  <span className="flex items-center gap-1 text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-[#223FA7]" />
                    {d.location || 'Test Range'}
                  </span>
                  <span className="font-mono text-gray-700">
                    Date: {d.requested_date ? new Date(d.requested_date).toLocaleDateString('en-IN') : 'Scheduled'}
                  </span>
                  <span>Requested By: {d.requested_by_name || d.requester_name || 'Field Officer'}</span>
                </div>

                <p className="text-xs text-gray-800">
                  {d.expected_audience ? `Target Audience: ${d.expected_audience}` : d.purpose ? `Purpose: ${d.purpose}` : 'Trial Assessment'}
                </p>

                {d.outcome_notes && (
                  <div className="pt-1 text-[11px] text-[#5871A5]">
                    Feedback / Outcome: <strong className="text-[#1A1A1A]">{d.outcome_notes}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Record Demo Outcome / Failure Analysis */}
                {d.status !== 'completed' && hasRole(['management', 'regional_manager', 'demo_team', 'admin']) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDemo(d);
                      setIsOutcomeOpen(true);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>Trial Outcome & Analysis</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reserve Modal */}
      <Modal
        isOpen={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        title="Reserve Demo Equipment Unit"
        description="Book equipment from Patna, Delhi, or Kolkata for field trials."
        maxWidth="md"
      >
        <form onSubmit={handleReserveSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Client / Battalion / Division Name"
            required
            value={newReserve.organisation_name}
            onChange={(e) => setNewReserve({ ...newReserve, organisation_name: e.target.value })}
            placeholder="e.g. 52 Special Action Group NSG Manesar"
          />

          <Select
            label="Select Equipment"
            required
            value={newReserve.demo_equipment_id}
            onChange={(e) => setNewReserve({ ...newReserve, demo_equipment_id: e.target.value })}
            options={[
              { value: '', label: '-- Choose from Depot Inventory --' },
              ...equipmentList.map((eq) => ({
                value: eq.id,
                label: `${eq.product_name || eq.model} (${eq.serial_no}) - ${eq.current_location || eq.depot_location} [${(eq.availability_status || eq.status || 'available').toUpperCase()}]`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Trial Location / Range"
              required
              value={newReserve.location}
              onChange={(e) => setNewReserve({ ...newReserve, location: e.target.value })}
              placeholder="e.g. CRPF Kadarpur Range"
            />
            <Input
              label="Scheduled Date"
              type="date"
              required
              value={newReserve.scheduled_date}
              onChange={(e) => setNewReserve({ ...newReserve, scheduled_date: e.target.value })}
            />
          </div>

          <Input
            label="Client & Demonstration Purpose"
            required
            value={newReserve.purpose}
            onChange={(e) => setNewReserve({ ...newReserve, purpose: e.target.value })}
            placeholder="e.g. Live firing range demonstration for IG Operations"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReserveOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Submit Reservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Outcome / Failure Analysis Modal */}
      <Modal
        isOpen={isOutcomeOpen}
        onClose={() => setIsOutcomeOpen(false)}
        title="Record Demo Trial Outcome & Failure Analysis"
        description="Capture client evaluation, technical performance, or root-cause failure data."
        maxWidth="md"
      >
        <form onSubmit={handleOutcomeSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Select
            label="Demo Result"
            value={outcomeStatus}
            onChange={(e) => setOutcomeStatus(e.target.value as any)}
            options={[
              { value: 'successful', label: 'SUCCESSFUL - Met All Operational Parameters' },
              { value: 'partial', label: 'PARTIAL - Re-trial or Calibration Requested' },
              { value: 'failed', label: 'FAILED - Technical Glitch or Disliked by Client' },
            ]}
          />

          {outcomeStatus === 'failed' && (
            <Input
              label="Failure Root-Cause Analysis"
              required
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="e.g. Lens fogging under high humidity / Battery drain / Incompatible mounting"
            />
          )}

          <Input
            label="Client Remarks & Technical Feedback"
            required
            value={clientFeedback}
            onChange={(e) => setClientFeedback(e.target.value)}
            placeholder="Feedback from attending officers, procurement sentiment..."
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
              Save Trial Analysis
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
