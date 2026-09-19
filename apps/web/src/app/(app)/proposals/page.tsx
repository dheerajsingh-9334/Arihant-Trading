'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Building,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatLakh } from '@arihant/shared';

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newProposal, setNewProposal] = useState({
    quotation_no: `ATC/QTN/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
    organisation_name: '',
    department: '',
    value_lakh: '',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Prices inclusive of GST, 1 year warranty, GeM standard terms.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/proposals', { limit: 50 });
      setProposals(res.data || []);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      const orgRes = await api.post('/organisations', {
        name: newProposal.organisation_name,
        department: newProposal.department,
        city: 'Delhi',
        state: 'North',
      });

      await api.post('/proposals', {
        organisation_id: orgRes.id,
        quotation_no: newProposal.quotation_no,
        value_lakh: Number(newProposal.value_lakh) || 0,
        valid_until: newProposal.valid_until,
        follow_up_date: newProposal.follow_up_date,
        terms: newProposal.terms,
      });

      setIsCreateOpen(false);
      setNewProposal({
        quotation_no: `ATC/QTN/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
        organisation_name: '',
        department: '',
        value_lakh: '',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: 'Prices inclusive of GST, 1 year warranty, GeM standard terms.',
      });
      await fetchProposals();
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-[#223FA7]" />
            <span>Commercial Proposals & Quotations</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Tracking commercial quotes submitted to state police, paramilitary forces, and private security agencies.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          variant="primary"
          className="shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Draft Quotation</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">Loading quotations...</div>
        ) : proposals.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">No proposals generated yet.</div>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl border border-[#D6E3F5] bg-white hover:border-[#3770E3] transition-all flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-[#223FA7]">
                    {p.quotation_no}
                  </span>
                  <Badge
                    variant={p.status === 'accepted' ? 'success' : p.status === 'rejected' ? 'danger' : 'default'}
                    size="sm"
                  >
                    {p.status?.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-2 text-sm font-bold text-[#1A1A1A] truncate">
                  {p.organisation_name || 'Client Agency'}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#5871A5] uppercase font-bold block">
                      Quotation Value
                    </span>
                    <span className="text-base font-extrabold text-[#1A1A1A]">
                      {formatLakh(p.value_lakh || 0)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#5871A5] uppercase font-bold block">
                      Follow-Up Due
                    </span>
                    <span className="font-mono text-xs text-amber-800 font-semibold">
                      {p.follow_up_date ? new Date(p.follow_up_date).toLocaleDateString('en-IN') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D6E3F5] text-[11px] text-[#5871A5] flex items-center justify-between">
                <span>Valid: {new Date(p.valid_until).toLocaleDateString('en-IN')}</span>
                <span>By: {p.created_by_name || 'Sales Staff'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Commercial Quotation"
        description="Draft pricing and commercial terms for buyer review."
        maxWidth="md"
      >
        <form onSubmit={handleCreateProposal} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quotation Reference"
              required
              value={newProposal.quotation_no}
              onChange={(e) => setNewProposal({ ...newProposal, quotation_no: e.target.value })}
            />
            <Input
              label="Value (₹ Lakh)"
              type="number"
              step="0.01"
              required
              value={newProposal.value_lakh}
              onChange={(e) => setNewProposal({ ...newProposal, value_lakh: e.target.value })}
              placeholder="15.50"
            />
          </div>

          <Input
            label="Client Organisation"
            required
            value={newProposal.organisation_name}
            onChange={(e) => setNewProposal({ ...newProposal, organisation_name: e.target.value })}
            placeholder="e.g. CRPF Group Centre Jalandhar"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valid Until"
              type="date"
              required
              value={newProposal.valid_until}
              onChange={(e) => setNewProposal({ ...newProposal, valid_until: e.target.value })}
            />
            <Input
              label="Follow-Up Date"
              type="date"
              required
              value={newProposal.follow_up_date}
              onChange={(e) => setNewProposal({ ...newProposal, follow_up_date: e.target.value })}
            />
          </div>

          <Input
            label="Commercial Terms & Warranty"
            value={newProposal.terms}
            onChange={(e) => setNewProposal({ ...newProposal, terms: e.target.value })}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Generate Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
