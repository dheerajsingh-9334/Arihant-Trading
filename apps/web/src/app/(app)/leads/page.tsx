'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Search,
  Plus,
  Building,
  User,
  Phone,
  Calendar,
  MessageSquare,
  TrendingUp,
  Tag,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Button,
  Badge,
  Card,
  CardContent,
  Modal,
  Input,
  Select,
  Tabs,
  EmptyState,
} from '@/components/ui';
import { formatLakh } from '@arihant/shared';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Selected lead & interactions
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);

  // New Lead state
  const [newLead, setNewLead] = useState({
    organisation_name: '',
    department: '',
    contact_name: '',
    contact_phone: '',
    contact_designation: '',
    title: '',
    category: 'active',
    channel: 'direct',
    estimated_value_lakh: '',
    probability: 'high',
    is_reapproached: false,
    remarks: '',
  });

  // Log interaction state
  const [newInteraction, setNewInteraction] = useState({
    type: 'meeting',
    interaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    next_action: '',
    next_action_date: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/leads', {
        search,
        category: activeTab !== 'all' ? activeTab : undefined,
        limit: 50,
      });
      setLeads(res.data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, activeTab]);

  const handleOpenLead = async (lead: any) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
    try {
      const res = await api.get('/interactions', { lead_id: lead.id });
      setInteractions(res.data || []);
    } catch {
      setInteractions([]);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      // 1. Create or ensure organisation
      const orgRes = await api.post('/organisations', {
        name: newLead.organisation_name,
        department: newLead.department,
        city: 'Delhi',
        state: 'Delhi',
      });

      // 2. Create contact if provided
      let contactId: string | undefined;
      if (newLead.contact_name) {
        const cRes = await api.post('/contacts', {
          organisation_id: orgRes.id,
          name: newLead.contact_name,
          phone: newLead.contact_phone,
          designation: newLead.contact_designation,
        });
        contactId = cRes.id;
      }

      // 3. Create lead
      await api.post('/leads', {
        organisation_id: orgRes.id,
        contact_id: contactId,
        title: newLead.title,
        category: newLead.category,
        channel: newLead.channel,
        estimated_value_lakh: Number(newLead.estimated_value_lakh) || 0,
        probability: newLead.probability,
        is_reapproached: newLead.is_reapproached,
        remarks: newLead.remarks,
      });

      setIsCreateOpen(false);
      setNewLead({
        organisation_name: '',
        department: '',
        contact_name: '',
        contact_phone: '',
        contact_designation: '',
        title: '',
        category: 'active',
        channel: 'direct',
        estimated_value_lakh: '',
        probability: 'high',
        is_reapproached: false,
        remarks: '',
      });
      await fetchLeads();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await api.post('/interactions', {
        lead_id: selectedLead.id,
        organisation_id: selectedLead.organisation_id,
        type: newInteraction.type,
        interaction_date: newInteraction.interaction_date,
        notes: newInteraction.notes,
        next_action: newInteraction.next_action || undefined,
        next_action_date: newInteraction.next_action_date || undefined,
      });

      setIsLogInteractionOpen(false);
      setNewInteraction({
        type: 'meeting',
        interaction_date: new Date().toISOString().split('T')[0],
        notes: '',
        next_action: '',
        next_action_date: '',
      });

      const updated = await api.get('/interactions', { lead_id: selectedLead.id });
      setInteractions(updated.data || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to log interaction.');
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
            <Target className="h-6 w-6 text-[#223FA7]" />
            <span>Defence Leads & Accounts CRM</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Tracking active opportunities, pre-tender discussions, and re-approached accounts.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Opportunity</span>
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Opportunities' },
            { id: 'active', label: 'Active Pipeline' },
            { id: 'expected', label: 'Expected Q3/Q4' },
            { id: 'follow_up', label: 'Follow-Up Stage' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#5871A5] z-10" />
          <Input
            type="text"
            placeholder="Search leads, clients, contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">
            Loading opportunities...
          </div>
        ) : leads.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Target}
              title="No leads found"
              description="No business opportunities or client leads match your active filters."
            />
          </div>
        ) : (
          leads.map((lead) => (
            <Card
              key={lead.id}
              variant="interactive"
              padding="md"
              onClick={() => handleOpenLead(lead)}
              className="flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#223FA7] transition-colors leading-tight">
                    {lead.title}
                  </span>
                  {lead.is_reapproached ? (
                    <Badge variant="warning" size="sm" className="shrink-0 text-[10px]">
                      RE-APPROACHED
                    </Badge>
                  ) : (
                    <Badge variant="info" size="sm" className="shrink-0 text-[10px]">
                      FRESH
                    </Badge>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-xs text-[#5871A5]">
                  <div className="flex items-center space-x-1.5 text-gray-700">
                    <Building className="h-3.5 w-3.5 text-[#5871A5] shrink-0" />
                    <span className="truncate">{lead.organisation_name || 'Organization'}</span>
                  </div>
                  {lead.contact_name && (
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-[#5871A5] shrink-0" />
                      <span className="truncate">
                        {lead.contact_name} ({lead.contact_designation || 'Officer'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#D6E3F5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5871A5] block">
                    Estimated Deal
                  </span>
                  <span className="text-sm font-extrabold text-[#223FA7]">
                    {formatLakh(lead.estimated_value_lakh || 0)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#5871A5] block">
                    Win Probability
                  </span>
                  <Badge
                    variant={
                      lead.probability === 'high'
                        ? 'success'
                        : lead.probability === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {lead.probability?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Lead Detail & Timeline Drawer */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedLead?.title || 'Lead Intelligence'}
        description={`Client: ${selectedLead?.organisation_name || 'Government Body'}`}
        maxWidth="2xl"
      >
        {selectedLead && (
          <div className="space-y-6 text-xs">
            {/* Meta Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5]">
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Stage</span>
                <Badge variant="info" size="sm" className="mt-1">
                  {selectedLead.category?.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Type</span>
                <span className="font-semibold text-[#1A1A1A] mt-1 block">
                  {selectedLead.is_reapproached ? 'Re-Approached' : 'Fresh Account'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Deal Size</span>
                <span className="font-extrabold text-[#223FA7] mt-1 block text-sm">
                  {formatLakh(selectedLead.estimated_value_lakh || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#5871A5] font-bold block">Owner</span>
                <span className="font-semibold text-gray-700 mt-1 block">
                  {selectedLead.assigned_name || 'Sales Officer'}
                </span>
              </div>
            </div>

            {/* Interaction Timeline Header */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-[#223FA7]" />
                <span>Field Interaction History & Minutes</span>
              </h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsLogInteractionOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Log Discussion</span>
              </Button>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3">
              {interactions.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] text-center text-[#5871A5]">
                  No interactions recorded yet. Click "Log Discussion" to add meeting minutes.
                </div>
              ) : (
                interactions.map((it) => (
                  <div
                    key={it.id}
                    className="p-3.5 rounded-xl bg-[#F7FBFF] border border-[#D6E3F5] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" size="sm" className="uppercase font-bold">
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

                    <p className="text-gray-800 leading-relaxed font-sans">{it.notes}</p>

                    {it.next_action && (
                      <div className="pt-1 flex items-center space-x-2 text-[11px] text-[#223FA7] font-medium">
                        <Clock className="h-3 w-3 text-[#5871A5]" />
                        <span>Next Step: {it.next_action}</span>
                        {it.next_action_date && (
                          <span className="font-mono text-[#5871A5]">
                            (Target: {new Date(it.next_action_date).toLocaleDateString('en-IN')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Log Interaction Modal */}
      <Modal
        isOpen={isLogInteractionOpen}
        onClose={() => setIsLogInteractionOpen(false)}
        title="Log Client Interaction"
        description="Record notes from phone calls, client meetings, or technical presentations."
        maxWidth="md"
      >
        <form onSubmit={handleLogInteraction} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={newInteraction.type}
              onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
              options={[
                { value: 'meeting', label: 'Face-to-Face Meeting' },
                { value: 'call', label: 'Phone Call' },
                { value: 'email', label: 'Email Correspondence' },
                { value: 'demo_followup', label: 'Demo Follow-Up' },
              ]}
            />
            <Input
              label="Date"
              type="date"
              required
              value={newInteraction.interaction_date}
              onChange={(e) => setNewInteraction({ ...newInteraction, interaction_date: e.target.value })}
            />
          </div>

          <Input
            label="Discussion Summary & Minutes"
            required
            value={newInteraction.notes}
            onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
            placeholder="Key discussion points, feedback on technical specs, procurement schedule..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Next Action Step"
              value={newInteraction.next_action}
              onChange={(e) => setNewInteraction({ ...newInteraction, next_action: e.target.value })}
              placeholder="e.g. Dispatch compliance sheet"
            />
            <Input
              label="Next Action Date"
              type="date"
              value={newInteraction.next_action_date}
              onChange={(e) => setNewInteraction({ ...newInteraction, next_action_date: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsLogInteractionOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Interaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Lead Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Lead Opportunity"
        description="Capture upcoming defence/security procurement requirements."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Opportunity Title"
            required
            value={newLead.title}
            onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
            placeholder="e.g. 50x Bomb Blankets for Rapid Action Force"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Organisation / Agency Name"
              required
              value={newLead.organisation_name}
              onChange={(e) => setNewLead({ ...newLead, organisation_name: e.target.value })}
              placeholder="e.g. Central Reserve Police Force"
            />
            <Input
              label="Department / Unit"
              value={newLead.department}
              onChange={(e) => setNewLead({ ...newLead, department: e.target.value })}
              placeholder="e.g. Logistics & Ordnance"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Key Contact Person"
              value={newLead.contact_name}
              onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
              placeholder="e.g. Col. Alok Mathur"
            />
            <Input
              label="Designation"
              value={newLead.contact_designation}
              onChange={(e) => setNewLead({ ...newLead, contact_designation: e.target.value })}
              placeholder="e.g. DIG Procurement"
            />
            <Input
              label="Phone"
              value={newLead.contact_phone}
              onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
              placeholder="+91 98110 00000"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Stage"
              value={newLead.category}
              onChange={(e) => setNewLead({ ...newLead, category: e.target.value })}
              options={[
                { value: 'active', label: 'Active Pipeline' },
                { value: 'expected', label: 'Expected Q3/Q4' },
                { value: 'follow_up', label: 'Follow-Up' },
              ]}
            />
            <Input
              label="Estimated Value (₹ Lakh)"
              type="number"
              step="0.1"
              value={newLead.estimated_value_lakh}
              onChange={(e) => setNewLead({ ...newLead, estimated_value_lakh: e.target.value })}
              placeholder="25.0"
            />
            <Select
              label="Probability"
              value={newLead.probability}
              onChange={(e) => setNewLead({ ...newLead, probability: e.target.value })}
              options={[
                { value: 'high', label: 'High (80%+)' },
                { value: 'medium', label: 'Medium (50%)' },
                { value: 'low', label: 'Low (20%)' },
              ]}
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
              Create Opportunity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
