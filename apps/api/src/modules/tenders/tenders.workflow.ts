import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthUser, TenderStatus } from '@arihant/shared';

@Injectable()
export class TendersWorkflowService {
  /**
   * Normalizes incoming status string (uppercase or lowercase) to standard internal lowercase TenderStatus.
   */
  normalizeStatus(status: string): TenderStatus {
    const s = (status || '').toLowerCase().trim();
    const map: Record<string, TenderStatus> = {
      identified: 'identified',
      awaiting_approval: 'awaiting_approval',
      awaiting_internal_approval: 'awaiting_approval',
      rejected_internally: 'rejected_internally',
      under_preparation: 'under_preparation',
      pq_submitted: 'pq_submitted',
      pq_qualified: 'pq_qualified',
      submitted: 'submitted',
      tender_submitted: 'submitted',
      technical_eval: 'technical_eval',
      technical_evaluation: 'technical_eval',
      commercial_eval: 'commercial_eval',
      commercial_evaluation: 'commercial_eval',
      won: 'won',
      lost: 'lost',
      cancelled: 'cancelled',
      on_hold: 'on_hold',
    };

    if (map[s]) return map[s];
    throw new BadRequestException(`Invalid tender status: "${status}"`);
  }

  /**
   * Returns human-readable executive label for a status.
   */
  getStatusLabel(status: TenderStatus | string): string {
    const norm = this.normalizeStatus(status);
    const labels: Record<TenderStatus, string> = {
      identified: 'Identified',
      awaiting_approval: 'Awaiting Internal Approval',
      rejected_internally: 'Rejected Internally',
      under_preparation: 'Under Preparation',
      pq_submitted: 'PQ Submitted',
      pq_qualified: 'PQ Qualified',
      submitted: 'Tender Submitted',
      technical_eval: 'Technical Evaluation',
      commercial_eval: 'Commercial Evaluation',
      won: 'Won',
      lost: 'Lost',
      cancelled: 'Cancelled',
      on_hold: 'On Hold',
    };
    return labels[norm] || norm;
  }

  /**
   * Valid transition matrix: fromStatus -> array of allowed target statuses
   */
  private readonly transitions: Record<TenderStatus, TenderStatus[]> = {
    identified: ['awaiting_approval', 'under_preparation', 'cancelled', 'on_hold'],
    awaiting_approval: ['under_preparation', 'rejected_internally', 'cancelled', 'on_hold'],
    rejected_internally: ['awaiting_approval', 'cancelled'],
    under_preparation: ['pq_submitted', 'submitted', 'cancelled', 'on_hold'],
    pq_submitted: ['pq_qualified', 'rejected_internally', 'lost', 'cancelled', 'on_hold'],
    pq_qualified: ['under_preparation', 'submitted', 'cancelled', 'on_hold'],
    submitted: ['technical_eval', 'commercial_eval', 'won', 'lost', 'cancelled', 'on_hold'],
    technical_eval: ['commercial_eval', 'lost', 'cancelled', 'on_hold'],
    commercial_eval: ['won', 'lost', 'cancelled', 'on_hold'],
    on_hold: [
      'identified',
      'awaiting_approval',
      'under_preparation',
      'pq_submitted',
      'submitted',
      'technical_eval',
      'commercial_eval',
      'cancelled',
    ],
    won: [],
    lost: [],
    cancelled: [],
  };

  /**
   * Validates whether a status transition is permitted.
   */
  canTransition(currentStatus: string, targetStatus: string): boolean {
    const from = this.normalizeStatus(currentStatus);
    const to = this.normalizeStatus(targetStatus);

    // No-op transition
    if (from === to) return true;

    const allowed = this.transitions[from] || [];
    return allowed.includes(to);
  }

  /**
   * Asserts transition validity and checks required fields and role permissions.
   */
  assertValidTransition(
    currentStatus: string,
    targetStatus: string,
    user: AuthUser,
    details?: {
      rejection_reason?: string | null;
      loss_reason?: string | null;
      value_lakh?: number | null;
    },
  ): { from: TenderStatus; to: TenderStatus } {
    const from = this.normalizeStatus(currentStatus);
    const to = this.normalizeStatus(targetStatus);

    if (from === to) {
      return { from, to };
    }

    // Terminal states cannot transition
    if (['won', 'lost', 'cancelled'].includes(from)) {
      throw new BadRequestException(
        `Cannot change status from completed terminal stage "${this.getStatusLabel(from)}"`,
      );
    }

    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Cannot move tender from "${this.getStatusLabel(from)}" directly to "${this.getStatusLabel(to)}". Valid next states: ${
          this.transitions[from]?.map((s) => `"${this.getStatusLabel(s)}"`).join(', ') || 'None'
        }`,
      );
    }

    // Role-based authorization for approval/rejection decisions
    if (to === 'under_preparation' && from === 'awaiting_approval') {
      const isApproverRole = ['management', 'admin', 'regional_manager'].includes(user.role);
      if (!isApproverRole) {
        throw new ForbiddenException(
          'Only Regional Managers or Executive Management can approve tender participation.',
        );
      }
    }

    if (to === 'rejected_internally') {
      const isApproverRole = ['management', 'admin', 'regional_manager'].includes(user.role);
      if (!isApproverRole) {
        throw new ForbiddenException(
          'Only Regional Managers or Executive Management can reject tender participation.',
        );
      }
      if (!details?.rejection_reason?.trim()) {
        throw new BadRequestException(
          'Rejection reason is mandatory when marking tender REJECTED_INTERNALLY.',
        );
      }
    }

    // Loss reason validation
    if (to === 'lost' && !details?.loss_reason?.trim()) {
      throw new BadRequestException('A structured loss reason is mandatory when marking tender as LOST.');
    }

    return { from, to };
  }
}
