import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { ProposalStatus, UserRole } from '@arihant/shared';

@Injectable()
export class ProposalsWorkflowService {
  private readonly validTransitions: Record<ProposalStatus, ProposalStatus[]> = {
    PROPOSAL_REQUESTED: ['UNDER_PREPARATION'],
    UNDER_PREPARATION: ['READY_FOR_REVIEW', 'PROPOSAL_REQUESTED'],
    READY_FOR_REVIEW: ['APPROVED', 'UNDER_PREPARATION'],
    APPROVED: ['SENT_TO_CUSTOMER'],
    SENT_TO_CUSTOMER: ['FOLLOW_UP_REQUIRED', 'CONVERTED', 'CLOSED', 'LOST'],
    FOLLOW_UP_REQUIRED: ['FOLLOW_UP_REQUIRED', 'CONVERTED', 'CLOSED', 'LOST'],
    CONVERTED: [],
    CLOSED: [],
    LOST: [],
    // Legacy aliases support:
    requested: ['UNDER_PREPARATION', 'under_preparation'],
    under_preparation: ['READY_FOR_REVIEW', 'ready_for_review', 'PROPOSAL_REQUESTED', 'requested'],
    ready_for_review: ['APPROVED', 'approved', 'UNDER_PREPARATION', 'under_preparation'],
    approved: ['SENT_TO_CUSTOMER', 'sent'],
    sent: ['FOLLOW_UP_REQUIRED', 'followup_required', 'CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost'],
    followup_required: ['FOLLOW_UP_REQUIRED', 'followup_required', 'CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost'],
    converted: [],
    closed: [],
    lost: [],
  };

  /**
   * Normalize any legacy lowercase status string to canonical uppercase enum
   */
  normalizeStatus(status: string): ProposalStatus {
    const map: Record<string, ProposalStatus> = {
      requested: 'PROPOSAL_REQUESTED',
      PROPOSAL_REQUESTED: 'PROPOSAL_REQUESTED',
      under_preparation: 'UNDER_PREPARATION',
      UNDER_PREPARATION: 'UNDER_PREPARATION',
      ready_for_review: 'READY_FOR_REVIEW',
      READY_FOR_REVIEW: 'READY_FOR_REVIEW',
      approved: 'APPROVED',
      APPROVED: 'APPROVED',
      sent: 'SENT_TO_CUSTOMER',
      SENT_TO_CUSTOMER: 'SENT_TO_CUSTOMER',
      followup_required: 'FOLLOW_UP_REQUIRED',
      FOLLOW_UP_REQUIRED: 'FOLLOW_UP_REQUIRED',
      converted: 'CONVERTED',
      CONVERTED: 'CONVERTED',
      closed: 'CLOSED',
      CLOSED: 'CLOSED',
      lost: 'LOST',
      LOST: 'LOST',
    };

    const normalized = map[status];
    if (!normalized) {
      throw new BadRequestException(`Invalid proposal status: ${status}`);
    }
    return normalized;
  }

  /**
   * Validates whether current status can transition to target status under user role
   */
  validateTransition(
    currentRaw: string,
    targetRaw: string,
    userRole: UserRole,
    details?: {
      lost_reason?: string;
      sent_date?: string;
    },
  ): { targetStatus: ProposalStatus } {
    const current = this.normalizeStatus(currentRaw);
    const target = this.normalizeStatus(targetRaw);

    if (current === target && target !== 'FOLLOW_UP_REQUIRED') {
      throw new BadRequestException(`Proposal is already in status ${target}`);
    }

    const allowed = this.validTransitions[current] || [];
    const isAllowed = allowed.includes(target);

    if (!isAllowed) {
      throw new BadRequestException(
        `Cannot move proposal from ${current} directly to ${target}`,
      );
    }

    // Role boundary checks
    if (target === 'APPROVED') {
      const allowedRoles: UserRole[] = ['management', 'admin', 'regional_manager'];
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenException(
          'Only management, admin, or regional managers can approve proposals',
        );
      }
    }

    // Target specific checks
    if (target === 'LOST' && (!details?.lost_reason || !details.lost_reason.trim())) {
      throw new BadRequestException('Lost reason is required when marking a proposal as LOST');
    }

    return { targetStatus: target };
  }
}
