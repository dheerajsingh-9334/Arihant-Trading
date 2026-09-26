import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

export async function seedModule5Proposals() {
  console.log('📑 Starting Module 5 — Proposal Management Demo Seed...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch Users
    const usersRes = await client.query(`
      SELECT id, email, full_name, role 
      FROM users 
      WHERE is_active = true
      ORDER BY created_at ASC;
    `);

    let mgmtUser = usersRes.rows.find(u => u.role === 'management' || u.role === 'admin') || usersRes.rows[0];
    let rmUser = usersRes.rows.find(u => u.role === 'regional_manager') || usersRes.rows[0];
    let salesUser = usersRes.rows.find(u => u.role === 'sales') || usersRes.rows[0];

    // 2. Fetch Organisations
    const orgsRes = await client.query(`SELECT id, name FROM organisations LIMIT 10;`);
    if (orgsRes.rows.length === 0) {
      throw new Error('No organisations found. Please run main seed first.');
    }
    const orgs = orgsRes.rows;

    // 3. Fetch Products
    const prodsRes = await client.query(`SELECT id, name FROM products LIMIT 10;`);
    if (prodsRes.rows.length === 0) {
      throw new Error('No products found. Please run main seed first.');
    }
    const prods = prodsRes.rows;

    // 4. Clean Proposal Data
    console.log('🧹 Cleaning existing proposal records...');
    await client.query(`
      DELETE FROM proposal_timeline;
      DELETE FROM proposal_follow_ups;
      DELETE FROM proposal_status_history;
      DELETE FROM proposal_versions;
      DELETE FROM proposal_products;
      DELETE FROM proposals;
    `);

    // Ensure default settings
    await client.query(`
      INSERT INTO proposal_settings (id, business_timezone, default_follow_up_days, no_follow_up_after_days, escalate_after_overdue_days, suggest_closure_after_days)
      VALUES (1, 'Asia/Kolkata', 3, 7, 3, 60)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('🌱 Seeding 16 comprehensive demo proposals across all buckets & workflows...');

    const today = new Date().toISOString().split('T')[0];
    const pastDate = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    const futureDate = (daysAhead: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const demoItems = [
      // 1. REQUESTED - Unassigned request
      {
        num: 'PRP-2026-00101',
        org: orgs[0],
        prod: prods[0],
        status: 'REQUESTED',
        reqDate: pastDate(1),
        compDate: futureDate(10),
        requestedBy: salesUser.id,
        responsible: null,
        owner: null,
        sentDate: null,
        nextFollowUp: null,
        remarks: 'New security enhancement enquiry via government portal. Needs engineer assignment.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Unassigned Requests',
      },
      // 2. UNDER_PREPARATION - Urgent lead time
      {
        num: 'PRP-2026-00102',
        org: orgs[1 % orgs.length],
        prod: prods[1 % prods.length],
        status: 'UNDER_PREPARATION',
        reqDate: today,
        compDate: futureDate(1),
        requestedBy: mgmtUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: null,
        nextFollowUp: null,
        remarks: 'VIP visit surveillance upgrade required within 24 hours.',
        isUrgent: true,
        sentLate: false,
        bucket: 'Urgent / Short Lead Time',
      },
      // 3. UNDER_PREPARATION - Preparation Overdue
      {
        num: 'PRP-2026-00103',
        org: orgs[2 % orgs.length],
        prod: prods[2 % prods.length],
        status: 'UNDER_PREPARATION',
        reqDate: pastDate(15),
        compDate: pastDate(3),
        requestedBy: salesUser.id,
        responsible: rmUser.id,
        owner: salesUser.id,
        sentDate: null,
        nextFollowUp: null,
        remarks: 'Complex industrial perimeter surveillance specs. Target date missed.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Preparation Overdue',
      },
      // 4. READY_FOR_REVIEW - Pending Approval Queue
      {
        num: 'PRP-2026-00104',
        org: orgs[3 % orgs.length],
        prod: prods[3 % prods.length],
        status: 'READY_FOR_REVIEW',
        reqDate: pastDate(5),
        compDate: futureDate(5),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: null,
        nextFollowUp: null,
        remarks: 'Bill of quantities finalized and ready for management authorization.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Pending My Approval',
      },
      // 5. APPROVED - Ready to dispatch
      {
        num: 'PRP-2026-00105',
        org: orgs[4 % orgs.length],
        prod: prods[4 % prods.length],
        status: 'APPROVED',
        reqDate: pastDate(4),
        compDate: futureDate(7),
        requestedBy: salesUser.id,
        responsible: rmUser.id,
        owner: salesUser.id,
        sentDate: null,
        nextFollowUp: null,
        remarks: 'Approved by Regional Manager. Awaiting dispatch to client procurement office.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Approved but Unsent',
      },
      // 6. SENT_TO_CUSTOMER - Due Today
      {
        num: 'PRP-2026-00106',
        org: orgs[0],
        prod: prods[1 % prods.length],
        status: 'SENT_TO_CUSTOMER',
        reqDate: pastDate(6),
        compDate: pastDate(2),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(3),
        nextFollowUp: today,
        remarks: 'Sent via registered email. First follow-up call scheduled for today.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Follow-ups Due Today',
      },
      // 7. FOLLOW_UP_REQUIRED - Overdue Follow-up
      {
        num: 'PRP-2026-00107',
        org: orgs[1 % orgs.length],
        prod: prods[2 % prods.length],
        status: 'FOLLOW_UP_REQUIRED',
        reqDate: pastDate(14),
        compDate: pastDate(8),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(8),
        nextFollowUp: pastDate(4),
        remarks: 'Follow-up missed by 4 days. Escalated to Regional Manager.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Overdue Follow-ups',
      },
      // 8. FOLLOW_UP_REQUIRED - Without Follow-up (> 7 days without contact)
      {
        num: 'PRP-2026-00108',
        org: orgs[2 % orgs.length],
        prod: prods[0],
        status: 'FOLLOW_UP_REQUIRED',
        reqDate: pastDate(20),
        compDate: pastDate(12),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(10),
        nextFollowUp: null,
        remarks: 'Dispatched 10 days ago but zero follow-up calls or emails logged.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Without Follow-up',
      },
      // 9. FOLLOW_UP_REQUIRED - Stale (> 21 days without movement)
      {
        num: 'PRP-2026-00109',
        org: orgs[3 % orgs.length],
        prod: prods[1 % prods.length],
        status: 'FOLLOW_UP_REQUIRED',
        reqDate: pastDate(45),
        compDate: pastDate(35),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(30),
        nextFollowUp: futureDate(10),
        remarks: 'Proposal sent a month ago. No recent contact or status movement.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Stale Proposals',
      },
      // 10. FOLLOW_UP_REQUIRED - Suggest Closure (> 60 days sent)
      {
        num: 'PRP-2026-00110',
        org: orgs[4 % orgs.length],
        prod: prods[2 % prods.length],
        status: 'FOLLOW_UP_REQUIRED',
        reqDate: pastDate(80),
        compDate: pastDate(70),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(65),
        nextFollowUp: futureDate(7),
        remarks: 'Sent 65 days ago. Client committee indecisive. Needs closure evaluation.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Suggest Closure',
      },
      // 11. FOLLOW_UP_REQUIRED - Needs Reassignment (Owner Inactive)
      {
        num: 'PRP-2026-00111',
        org: orgs[0],
        prod: prods[2 % prods.length],
        status: 'FOLLOW_UP_REQUIRED',
        reqDate: pastDate(25),
        compDate: pastDate(15),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(15),
        nextFollowUp: futureDate(3),
        remarks: 'Assigned sales engineer relocated. Needs reassignment.',
        isUrgent: false,
        sentLate: false,
        ownerInactive: true,
        bucket: 'Needs Reassignment',
      },
      // 12. CONVERTED - Won Outcome
      {
        num: 'PRP-2026-00112',
        org: orgs[1 % orgs.length],
        prod: prods[0],
        status: 'CONVERTED',
        reqDate: pastDate(30),
        compDate: pastDate(20),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(22),
        outcomeDate: pastDate(5),
        nextFollowUp: null,
        remarks: 'Successfully converted! Client issued Purchase Order PO-2026-8819.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Outcome: Converted',
      },
      // 13. LOST - Lost to Competitor
      {
        num: 'PRP-2026-00113',
        org: orgs[2 % orgs.length],
        prod: prods[1 % prods.length],
        status: 'LOST',
        reqDate: pastDate(40),
        compDate: pastDate(25),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(28),
        outcomeDate: pastDate(7),
        lostCode: 'Price',
        lostText: 'Competitor provided 15% lower commercial quote on standard warranty.',
        competitor: 'Bharat Surveillance Tech',
        nextFollowUp: null,
        remarks: 'Lost during final pricing committee meeting.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Outcome: Lost',
      },
      // 14. CLOSED - Pre-send Cancelled (E29)
      {
        num: 'PRP-2026-00114',
        org: orgs[3 % orgs.length],
        prod: prods[0],
        status: 'CLOSED',
        reqDate: pastDate(12),
        compDate: pastDate(2),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: null,
        sentDate: null,
        outcomeDate: pastDate(2),
        closureCode: 'Cancelled by requester',
        closureText: 'Internal security expansion project cancelled by client management.',
        nextFollowUp: null,
        remarks: 'Cancelled before quotation preparation completed.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Outcome: Closed (Pre-send)',
      },
      // 15. SENT_TO_CUSTOMER - Sent Late (E26)
      {
        num: 'PRP-2026-00115',
        org: orgs[4 % orgs.length],
        prod: prods[1 % prods.length],
        status: 'SENT_TO_CUSTOMER',
        reqDate: pastDate(20),
        compDate: pastDate(10), // Required date was 10 days ago
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(5),  // Sent 5 days ago (> required date)
        nextFollowUp: futureDate(2),
        remarks: 'Dispatched after required deadline due to technical spec delays. Flagged in KPIs.',
        isUrgent: false,
        sentLate: true,
        bucket: 'Sent Late',
      },
      // 16. UNDER_PREPARATION - Customer Revision Requested (v2) (E25)
      {
        num: 'PRP-2026-00116',
        org: orgs[0],
        prod: prods[0],
        status: 'UNDER_PREPARATION',
        reqDate: pastDate(30),
        compDate: futureDate(15),
        requestedBy: salesUser.id,
        responsible: salesUser.id,
        owner: salesUser.id,
        sentDate: pastDate(14),
        version: 2,
        nextFollowUp: null,
        remarks: 'Client requested architectural revision v2 to add fiber redundancy.',
        isUrgent: false,
        sentLate: false,
        bucket: 'Revision Requested (v2)',
      },
    ];

    for (const item of demoItems) {
      const insRes = await client.query(`
        INSERT INTO proposals (
          proposal_no, proposal_number, customer_id, organisation_id, sector,
          requested_by_id, requested_by, created_by_id, created_by,
          responsible_person_id, responsible_id, follow_up_owner_id, followup_owner_id,
          request_date, required_date, sent_date, current_version, status,
          next_follow_up_date, next_followup, remarks, is_urgent, sent_late,
          outcome_date, lost_reason_code, lost_reason_text, lost_to_competitor,
          closure_reason_code, closure_reason_text, owner_inactive_flag,
          last_activity_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $3, 'Commercial',
          $4, $4, $4, $4,
          $5, $5, $6, $6,
          $7, $8, $9, $10, $11,
          $12, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21, $22,
          NOW(), NOW(), NOW()
        ) RETURNING id;
      `, [
        item.num,
        item.num.replace('PRP-', 'PROP-').replace('-00', '-'),
        item.org.id,
        item.requestedBy,
        item.responsible,
        item.owner,
        item.reqDate,
        item.compDate,
        item.sentDate,
        (item as any).version || 1,
        item.status,
        item.nextFollowUp,
        item.remarks,
        item.isUrgent,
        item.sentLate,
        (item as any).outcomeDate || null,
        (item as any).lostCode || null,
        (item as any).lostText || null,
        (item as any).competitor || null,
        (item as any).closureCode || null,
        (item as any).closureText || null,
        (item as any).ownerInactive || false,
      ]);

      const proposalId = insRes.rows[0].id;

      // Primary Product
      await client.query(`
        INSERT INTO proposal_products (proposal_id, product_id, is_primary)
        VALUES ($1, $2, true);
      `, [proposalId, item.prod.id]);

      // Version Record
      await client.query(`
        INSERT INTO proposal_versions (
          proposal_id, version_no, change_summary, email_references, sent_date, created_by
        ) VALUES (
          $1, 1, 'Initial proposal baseline', $2::jsonb, $3, $4
        );
      `, [proposalId, JSON.stringify(['DISPATCH-REF-001']), item.sentDate, item.requestedBy]);

      // If version 2
      if ((item as any).version === 2) {
        await client.query(`
          INSERT INTO proposal_versions (
            proposal_id, version_no, change_summary, email_references, created_by
          ) VALUES (
            $1, 2, 'Revised with fiber redundancy specifications', $2::jsonb, $3
          );
        `, [proposalId, JSON.stringify(['DISPATCH-REV-002']), item.requestedBy]);
      }

      // Initial Status History
      await client.query(`
        INSERT INTO proposal_status_history (
          proposal_id, from_status, to_status, reason, actor_id
        ) VALUES ($1, NULL, $2, 'Seeded proposal workflow', $3);
      `, [proposalId, item.status, item.requestedBy]);

      // Seed follow-up for items with contact history
      if (item.sentDate && item.status !== 'REQUESTED') {
        await client.query(`
          INSERT INTO proposal_follow_ups (
            proposal_id, contact_date, mode, contact_person, summary, response, next_follow_up_date, logged_by
          ) VALUES (
            $1, $2, 'Call', 'Procurement Officer', 'Discussed technical specifications and tender compliance', 'Positive', $3, $4
          );
        `, [proposalId, item.sentDate, item.nextFollowUp, item.owner || item.requestedBy]);
      }

      // Seed Timeline
      await client.query(`
        INSERT INTO proposal_timeline (
          proposal_id, event_type, category, title, description, metadata, occurred_at
        ) VALUES (
          $1, 'proposal.requested', 'lifecycle', 'Proposal Created', $2, '{"seeded": true}', NOW()
        );
      `, [proposalId, item.remarks]);
    }

    await client.query('COMMIT');
    console.log('✅ Module 5: Proposal Management Seed Completed Successfully!');

    console.log('\n📊 SEEDED PROPOSAL DASHBOARD MATRIX:');
    console.log('--------------------------------------------------------------------------');
    for (const d of demoItems) {
      console.log(`  • [${d.num}] ${d.status.padEnd(20)} | ${d.bucket.padEnd(28)} | ${d.org.name.slice(0, 20)}`);
    }
    console.log('--------------------------------------------------------------------------\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding proposal management module:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct execution: tsx db/seed/seed_module5_proposals.ts
if (process.argv[1]?.includes('seed_module5_proposals')) {
  seedModule5Proposals().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
