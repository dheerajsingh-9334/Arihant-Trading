'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  User,
  ShieldAlert,
  FileCheck,
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
  Tabs,
  PageContainer,
  PageHeader,
  EmptyState,
} from '@/components/ui';

export default function ServicePage() {
  const { user, hasRole } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Modals
  const [isLogTicketOpen, setIsLogTicketOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    organisation_name: '',
    ticket_no: `SRV/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
    complaint: '',
    priority: 'high',
    serial_no: '',
  });

  // Service report form
  const [reportForm, setReportForm] = useState({
    work_done: '',
    spares_replaced: '',
    customer_signoff_by: '',
    customer_remarks: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/service/tickets', {
        status: activeTab !== 'all' ? activeTab : undefined,
        limit: 50,
      });
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const handleLogTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      const orgRes = await api.post('/organisations', {
        name: newTicket.organisation_name,
        city: 'Delhi',
        state: 'North',
      });

      await api.post('/service/tickets', {
        organisation_id: orgRes.id,
        ticket_no: newTicket.ticket_no,
        complaint: newTicket.complaint,
        priority: newTicket.priority,
        serial_no: newTicket.serial_no || undefined,
      });

      setIsLogTicketOpen(false);
      setNewTicket({
        organisation_name: '',
        ticket_no: `SRV/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
        complaint: '',
        priority: 'high',
        serial_no: '',
      });
      await fetchTickets();
    } catch (err: any) {
      setActionError(err.message || 'Failed to log service complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post(`/service/tickets/${selectedTicket.id}/report`, {
        problem_identified: selectedTicket.complaint || 'Reported breakdown investigated on site',
        action_taken: reportForm.work_done,
        parts_replaced: reportForm.spares_replaced || undefined,
        warranty_status: 'in_warranty',
        customer_confirmation: true,
      });

      setIsResolveModalOpen(false);
      setReportForm({
        work_done: '',
        spares_replaced: '',
        customer_signoff_by: '',
        customer_remarks: '',
      });
      await fetchTickets();
    } catch (err: any) {
      setActionError(err.message || 'Failed to file service report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        badge="Module 11 — Maintenance & Support"
        title="Service Desk, Spares & AMC Support"
        subtitle="Breakdown maintenance, on-site engineer deployment, and customer signoff vouchers."
        icon={<Wrench className="h-5 w-5 text-[#223FA7]" />}
        actions={
          <Button
            onClick={() => setIsLogTicketOpen(true)}
            variant="primary"
            className="shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Log Breakdown Ticket</span>
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'All Tickets' },
          { id: 'open', label: 'Open Incidents', count: tickets.filter((t) => t.status === 'open').length },
          { id: 'in_progress', label: 'Engineer Deployed' },
          { id: 'resolved', label: 'Resolved & Signed Off' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">Loading service tickets...</div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No service tickets found"
            description="All client equipment and defense units in this filter are currently operating normally."
          />
        ) : (
          tickets.map((t) => (
            <Card
              key={t.id}
              padding="md"
              className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-xs font-bold text-[#223FA7]">
                    {t.ticket_no}
                  </span>
                  <Badge
                    variant={
                      t.priority === 'critical'
                        ? 'urgent'
                        : t.priority === 'high'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {t.priority.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={t.status === 'resolved' ? 'success' : 'info'}
                    size="sm"
                  >
                    {t.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-sm font-bold text-[#1A1A1A]">
                  {t.organisation_name || 'Client Agency'}
                </div>

                <p className="text-xs text-[#1A1A1A] font-medium">
                  Complaint: {t.complaint}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-[#5871A5]">
                  <span>Assigned: <strong className="text-[#1A1A1A]">{t.assigned_name || 'Chief Service Engineer'}</strong></span>
                  <span>Logged: {new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                  {t.serial_no && <span className="font-mono">S/N: {t.serial_no}</span>}
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {t.status !== 'resolved' && t.status !== 'closed' && hasRole(['service_team', 'admin']) && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedTicket(t);
                      setIsResolveModalOpen(true);
                    }}
                  >
                    <FileCheck className="h-3.5 w-3.5 mr-1" />
                    <span>Submit Service Report</span>
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Log Ticket Modal */}
      <Modal
        isOpen={isLogTicketOpen}
        onClose={() => setIsLogTicketOpen(false)}
        title="Log Equipment Breakdown Incident"
        description="Register a maintenance ticket under warranty or AMC agreement."
        maxWidth="md"
      >
        <form onSubmit={handleLogTicket} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ticket Ref"
              required
              value={newTicket.ticket_no}
              onChange={(e) => setNewTicket({ ...newTicket, ticket_no: e.target.value })}
            />
            <Select
              label="Priority Level"
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              options={[
                { value: 'critical', label: 'Critical - System Offline' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Routine Preventative' },
              ]}
            />
          </div>

          <Input
            label="Client Body / Station"
            required
            value={newTicket.organisation_name}
            onChange={(e) => setNewTicket({ ...newTicket, organisation_name: e.target.value })}
            placeholder="e.g. Delhi Police Traffic Branch / BSF Border Outpost"
          />

          <Input
            label="Equipment Serial No."
            value={newTicket.serial_no}
            onChange={(e) => setNewTicket({ ...newTicket, serial_no: e.target.value })}
            placeholder="e.g. SN-NVD-2026-042"
          />

          <Input
            label="Defect Description / Complaint"
            required
            value={newTicket.complaint}
            onChange={(e) => setNewTicket({ ...newTicket, complaint: e.target.value })}
            placeholder="e.g. Power failure in crash bollard hydraulic pump unit"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogTicketOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Dispatch Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Engineer Service Report Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="File Service & Rectification Report"
        description="Capture engineer actions, spare parts consumed, and officer signoff."
        maxWidth="md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Work Done & Rectification Summary"
            required
            value={reportForm.work_done}
            onChange={(e) => setReportForm({ ...reportForm, work_done: e.target.value })}
            placeholder="e.g. Replaced faulty PCB assembly, flushed hydraulic oil, re-calibrated sensors."
          />

          <Input
            label="Spares Consumed / Replaced"
            value={reportForm.spares_replaced}
            onChange={(e) => setReportForm({ ...reportForm, spares_replaced: e.target.value })}
            placeholder="e.g. Hydraulic Seal Kit #SK-402, Microswitch #MS-11"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Signoff Officer"
              required
              value={reportForm.customer_signoff_by}
              onChange={(e) => setReportForm({ ...reportForm, customer_signoff_by: e.target.value })}
              placeholder="e.g. Insp. Rajendra Singh"
            />
            <Input
              label="Customer Satisfaction Notes"
              value={reportForm.customer_remarks}
              onChange={(e) => setReportForm({ ...reportForm, customer_remarks: e.target.value })}
              placeholder="e.g. Satisfactory test run completed."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Sign Off & Close Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
