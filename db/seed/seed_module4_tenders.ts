import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

export async function seedModule4Tenders() {
  console.log('🏛️ Starting Module 4 — Tender Management 16-Tender Demo Seed...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch Users
    const usersRes = await client.query(`
      SELECT id, email, full_name, role, zone_id 
      FROM users 
      WHERE is_active = true
      ORDER BY created_at ASC;
    `);

    let mgmtUser = usersRes.rows.find(u => u.role === 'management' || u.role === 'admin');
    let salesUser = usersRes.rows.find(u => u.role === 'sales');
    let tenderUser = usersRes.rows.find(u => u.role === 'tender_team') || salesUser;

    if (!mgmtUser) {
      const inserted = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ('director@arihant.com', '$2a$10$wT1rK0nK6F9QeQx4E2i1Uu1g7rK8h5H.N4B7.M9p5V4q6F8g0H1e', 'Executive Director', 'management', true)
        RETURNING id, email, full_name, role;
      `);
      mgmtUser = inserted.rows[0];
    }
    if (!salesUser) {
      const inserted = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ('sales.lead@arihant.com', '$2a$10$wT1rK0nK6F9QeQx4E2i1Uu1g7rK8h5H.N4B7.M9p5V4q6F8g0H1e', 'Rohan Sharma', 'sales', true)
        RETURNING id, email, full_name, role;
      `);
      salesUser = inserted.rows[0];
    }
    if (!tenderUser) tenderUser = salesUser;

    // 2. Fetch Categories
    const catRes = await client.query(`SELECT id, code, name, requires_pq FROM tender_categories;`);
    const pqCat = catRes.rows.find(c => c.code === 'PQ') || catRes.rows[0];
    const genCat = catRes.rows.find(c => c.code === 'GENERAL_MHA') || catRes.rows[1] || catRes.rows[0];

    // 3. Fetch Zones & Regions
    const zonesRes = await client.query(`SELECT id, name FROM zones;`);
    const regionsRes = await client.query(`SELECT id, name, zone_id FROM regions;`);

    const getZone = (name: string) => zonesRes.rows.find(z => z.name.toLowerCase().includes(name.toLowerCase()))?.id || zonesRes.rows[0]?.id;
    const getRegion = (name: string, zoneId: string) => {
      const found = regionsRes.rows.find(r => r.zone_id === zoneId && r.name.toLowerCase().includes(name.toLowerCase()));
      return found?.id || regionsRes.rows.find(r => r.zone_id === zoneId)?.id || regionsRes.rows[0]?.id;
    };

    const northZone = getZone('North');
    const westZone = getZone('West');
    const eastZone = getZone('East');
    const southZone = getZone('South');
    const neZone = getZone('North East') || northZone;

    const delhiRegion = getRegion('Delhi', northZone);
    const rajasthanRegion = getRegion('Rajasthan', northZone);
    const upRegion = getRegion('Uttar Pradesh', northZone);
    const haryanaRegion = getRegion('Haryana', northZone);
    const punjabRegion = getRegion('Punjab', northZone);
    const maharashtraRegion = getRegion('Maharashtra', westZone);
    const biharRegion = getRegion('Bihar', eastZone);
    const wbRegion = getRegion('West Bengal', eastZone);
    const karnatakaRegion = getRegion('Karnataka', southZone);
    const assamRegion = getRegion('Assam', neZone);
    const meghalayaRegion = getRegion('Meghalaya', neZone);

    // 4. Fetch Products
    const prodRes = await client.query(`SELECT id, name FROM products;`);
    const getProduct = (search: string) => prodRes.rows.find(p => p.name.toLowerCase().includes(search.toLowerCase()))?.id || prodRes.rows[0]?.id;

    const hhmdProd = getProduct('Hand Held');
    const dfmdProd = getProduct('Door Frame');
    const xrayProd = getProduct('X ray');
    const bodyScannerProd = getProduct('Full Body');
    const thermalProd = getProduct('thermal');
    const nightVisionProd = getProduct('Night Vision');
    const bombBlanketProd = getProduct('Bomb Blanket');
    const mineDetectorProd = getProduct('Mine');
    const breathAnalyserProd = getProduct('Breath');
    const smokeExhausterProd = getProduct('Smoke');
    const barrierProd = getProduct('BARRIER');
    const binocularProd = getProduct('binocular');
    const accessControlProd = getProduct('Access Control');

    // 5. Ensure Approvers & Settings
    await client.query(`
      INSERT INTO tender_approvers (user_id)
      VALUES ('${mgmtUser.id}')
      ON CONFLICT (user_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO tender_settings (
        id, upcoming_days, approaching_days, approval_sla_hours, result_followup_days,
        allow_self_approval, require_won_value, escalation_user_ids
      ) VALUES (
        1, 7, 3, 24, 15, false, true, jsonb_build_array('${mgmtUser.id}'::text)
      ) ON CONFLICT (id) DO UPDATE SET
        upcoming_days = 7, approaching_days = 3, approval_sla_hours = 24;
    `);

    // Clean any prior demo tenders
    const demoNumbers = [
      'DEMO-TND-001', 'DEMO-TND-002', 'DEMO-TND-003', 'DEMO-TND-004',
      'DEMO-TND-005', 'DEMO-TND-006', 'DEMO-TND-007', 'DEMO-TND-008',
      'DEMO-TND-009', 'DEMO-TND-010', 'DEMO-TND-011', 'DEMO-TND-012',
      'DEMO-TND-013', 'DEMO-TND-014', 'DEMO-TND-015', 'DEMO-TND-016',
    ];

    await client.query(`
      DELETE FROM tenders WHERE tender_number = ANY($1::text[]) OR tender_no = ANY($1::text[]);
    `, [demoNumbers]);

    const now = new Date();
    const daysOffset = (d: number, hours = 15) => {
      const target = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
      target.setUTCHours(hours - 5, 30, 0, 0); // 15:00 IST is 09:30 UTC
      return target.toISOString();
    };

    const pubDate = (dAgo: number) => {
      const target = new Date(now.getTime() - dAgo * 24 * 60 * 60 * 1000);
      return target.toISOString().split('T')[0];
    };

    // 6. Define 16 Comprehensive Demo Tenders
    const demoTenders = [
      {
        num: 'DEMO-TND-001',
        org: 'Central Reserve Police Force (CRPF)',
        dept: 'Procurement & Ordnance Wing',
        prod: hhmdProd,
        city: 'New Delhi',
        state: 'Delhi',
        zone: northZone,
        region: delhiRegion,
        cat: genCat.id,
        pub: pubDate(10),
        sub: daysOffset(5), // Approaching deadline chip (amber)
        assignee: salesUser.id,
        status: 'identified',
        value: 4500000,
        portal: 'GeM',
        url: 'https://gem.gov.in/tenders/crpf-hhmd-001',
        remarks: 'CRPF HQ requirement for 400 Hand Held Metal Detectors across regional battalions.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-002',
        org: 'Border Security Force (BSF)',
        dept: 'Communication & Surveillance Directorate',
        prod: nightVisionProd,
        city: 'Jodhpur',
        state: 'Rajasthan',
        zone: northZone,
        region: rajasthanRegion,
        cat: genCat.id,
        pub: pubDate(5),
        sub: daysOffset(10), // Upcoming deadline chip (yellow)
        assignee: salesUser.id,
        status: 'awaiting_approval',
        value: 12000000,
        portal: 'CPPP',
        url: 'https://eprocure.gov.in/bsf-nv-002',
        remarks: 'Western command border patrolling requirements. Awaiting internal management sanction.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-003',
        org: 'Indo-Tibetan Border Police (ITBP)',
        dept: 'Logistics & Equipment Wing',
        prod: thermalProd,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        zone: northZone,
        region: upRegion,
        cat: genCat.id,
        pub: pubDate(12),
        sub: daysOffset(6),
        assignee: salesUser.id,
        status: 'under_preparation',
        value: 8500000,
        portal: 'GeM',
        url: 'https://gem.gov.in/tenders/itbp-ti-003',
        remarks: 'Approved by management; technical compliance document and OEM authorization in preparation.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-004',
        org: 'Sashastra Seema Bal (SSB)',
        dept: 'Signals & Surveillance Division',
        prod: mineDetectorProd,
        city: 'Patna',
        state: 'Bihar',
        zone: eastZone,
        region: biharRegion,
        cat: genCat.id,
        pub: pubDate(15),
        sub: daysOffset(14),
        assignee: salesUser.id,
        status: 'under_preparation',
        on_hold: true,
        status_before_hold: 'under_preparation',
        value: 6200000,
        portal: 'State Portal',
        url: 'https://eproc.bihar.gov.in/ssb-mine-004',
        remarks: 'ON HOLD: Waiting for OEM clarification on dual-frequency search head specifications.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-005',
        org: 'Central Industrial Security Force (CISF)',
        dept: 'Airport Security Group (ASG)',
        prod: xrayProd,
        city: 'Mumbai',
        state: 'Maharashtra',
        zone: westZone,
        region: maharashtraRegion,
        cat: pqCat.id,
        pub: pubDate(25),
        sub: daysOffset(-2), // Submitted before deadline
        assignee: salesUser.id,
        status: 'pq_submitted',
        value: 25000000,
        portal: 'GeM',
        url: 'https://gem.gov.in/cisf-asg-xray-005',
        remarks: 'Pre-qualification dossier submitted for 12 Tier-1 airport baggage scanners.',
        checklist: true,
      },
      {
        num: 'DEMO-TND-006',
        org: 'Delhi Police Headquarter',
        dept: 'Modernisation & Technical Wing',
        prod: bodyScannerProd,
        city: 'New Delhi',
        state: 'Delhi',
        zone: northZone,
        region: delhiRegion,
        cat: pqCat.id,
        pub: pubDate(40),
        sub: daysOffset(-15),
        assignee: salesUser.id,
        status: 'pq_qualified',
        value: 40000000,
        portal: 'CPPP',
        url: 'https://eprocure.gov.in/dp-fbs-006',
        remarks: 'Pre-qualification successfully approved! Qualified for upcoming financial and technical RFP.',
        checklist: true,
      },
      {
        num: 'DEMO-TND-007',
        org: 'National Security Guard (NSG)',
        dept: 'Bomb Disposal Squad (BDS)',
        prod: bombBlanketProd,
        city: 'Gurugram',
        state: 'Haryana',
        zone: northZone,
        region: haryanaRegion,
        cat: genCat.id,
        pub: pubDate(18),
        sub: daysOffset(4),
        assignee: salesUser.id,
        status: 'submitted',
        value: 6000000,
        portal: 'GeM',
        url: 'https://gem.gov.in/nsg-bds-007',
        remarks: 'Tender bids uploaded. Encountered GeM gateway upload timeout during certificate submission.',
        checklist: true,
        hasPortalIssue: true,
      },
      {
        num: 'DEMO-TND-008',
        org: 'Assam Rifles Directorate',
        dept: 'Quartermaster Branch',
        prod: getProduct('Real Time'),
        city: 'Shillong',
        state: 'Assam',
        zone: neZone,
        region: assamRegion,
        cat: genCat.id,
        pub: pubDate(30),
        sub: daysOffset(-10),
        assignee: salesUser.id,
        status: 'technical_eval',
        value: 7500000,
        portal: 'CPPP',
        url: 'https://eprocure.gov.in/ar-rts-008',
        remarks: 'Technical committee currently reviewing optical zoom and MHA QR compliance.',
        checklist: true,
      },
      {
        num: 'DEMO-TND-009',
        org: 'Karnataka State Police Headquarter',
        dept: 'Cyber & Technical Services',
        prod: dfmdProd,
        city: 'Bengaluru',
        state: 'Karnataka',
        zone: southZone,
        region: karnatakaRegion,
        cat: genCat.id,
        pub: pubDate(35),
        sub: daysOffset(-18),
        assignee: salesUser.id,
        status: 'commercial_eval',
        value: 9500000,
        portal: 'State Portal',
        url: 'https://kppp.karnataka.gov.in/ksp-dfmd-009',
        remarks: 'Technical evaluation cleared with 100% compliance. Financial bids opening this Friday.',
        checklist: true,
      },
      {
        num: 'DEMO-TND-010',
        org: 'Uttar Pradesh Police Headquarters',
        dept: 'Security Branch, Signature Building',
        prod: hhmdProd,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        zone: northZone,
        region: upRegion,
        cat: genCat.id,
        pub: pubDate(60),
        sub: daysOffset(-30),
        assignee: salesUser.id,
        status: 'won',
        value: 11500000,
        portal: 'GeM',
        url: 'https://gem.gov.in/upp-hhmd-010',
        remarks: 'L1 verified and contract awarded! Total supply order value ₹1.15 Cr.',
        checklist: true,
        isWon: true,
        wonValue: 11500000,
        competitor: 'Godrej Security Solutions',
      },
      {
        num: 'DEMO-TND-011',
        org: 'Airports Authority of India (AAI)',
        dept: 'Aviation Safety & Security Directorate',
        prod: xrayProd,
        city: 'New Delhi',
        state: 'Delhi',
        zone: northZone,
        region: delhiRegion,
        cat: pqCat.id,
        pub: pubDate(75),
        sub: daysOffset(-45),
        assignee: salesUser.id,
        status: 'won',
        value: 35000000,
        portal: 'CPPP',
        url: 'https://eprocure.gov.in/aai-xray-011',
        remarks: 'Pure Empanelment PQ Opportunity won (§11 spec). Arihant empanelled as primary security vendor.',
        checklist: true,
        isWon: true,
        wonValue: 35000000,
        competitor: 'Smiths Detection India',
      },
      {
        num: 'DEMO-TND-012',
        org: 'Indian Coast Guard',
        dept: 'Material Organization (Kolkata)',
        prod: binocularProd,
        city: 'Kolkata',
        state: 'West Bengal',
        zone: eastZone,
        region: wbRegion,
        cat: genCat.id,
        pub: pubDate(50),
        sub: daysOffset(-25),
        assignee: salesUser.id,
        status: 'lost',
        value: 4800000,
        portal: 'CPPP',
        url: 'https://eprocure.gov.in/icg-bino-012',
        remarks: 'Disqualified at technical evaluation due to weight parameter variance by 150g.',
        checklist: true,
        isLost: true,
        lossReasons: ['TECHNICAL', 'DOCUMENTATION'],
        competitor: 'BEL Optronics Ltd',
      },
      {
        num: 'DEMO-TND-013',
        org: 'Punjab Police Telecom Wing',
        dept: 'Technical Procurement Branch',
        prod: breathAnalyserProd,
        city: 'Chandigarh',
        state: 'Punjab',
        zone: northZone,
        region: punjabRegion,
        cat: genCat.id,
        pub: pubDate(55),
        sub: daysOffset(-28),
        assignee: salesUser.id,
        status: 'lost',
        value: 5200000,
        portal: 'State Portal',
        url: 'https://eproc.punjab.gov.in/pp-ba-013',
        remarks: 'L2 in financial bid. Competitor undercut by 4.2% on bulk consumable sensor calibration.',
        checklist: true,
        isLost: true,
        lossReasons: ['PRICING'],
        competitor: 'SecureEye Systems Pvt Ltd',
      },
      {
        num: 'DEMO-TND-014',
        org: 'Meghalaya Home Guards & Civil Defence',
        dept: 'Disaster Management Unit',
        prod: smokeExhausterProd,
        city: 'Shillong',
        state: 'Meghalaya',
        zone: neZone,
        region: meghalayaRegion,
        cat: genCat.id,
        pub: pubDate(45),
        sub: daysOffset(-20),
        assignee: salesUser.id,
        status: 'cancelled',
        value: 3800000,
        portal: 'State Portal',
        url: 'https://meghalaya.gov.in/tenders/smoke-014',
        remarks: 'Tender scrapped by buyer authority citing revision of technical parameters and budget reallocation.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-015',
        org: 'Rajasthan Industrial Security Force (RISF)',
        dept: 'Perimeter Security Directorate',
        prod: barrierProd,
        city: 'Jaipur',
        state: 'Rajasthan',
        zone: northZone,
        region: rajasthanRegion,
        cat: genCat.id,
        pub: pubDate(20),
        sub: daysOffset(12),
        assignee: salesUser.id,
        status: 'rejected_internally',
        value: 7000000,
        portal: 'State Portal',
        url: 'https://sppp.rajasthan.gov.in/risf-barrier-015',
        remarks: 'Management rejected participation: 180-day credit period with 20% PBG is financially unviable.',
        checklist: false,
      },
      {
        num: 'DEMO-TND-016',
        org: 'CRPF Signal Bn Headquarters',
        dept: 'Wireless Communications & Access Division',
        prod: accessControlProd,
        city: 'New Delhi',
        state: 'Delhi',
        zone: northZone,
        region: delhiRegion,
        cat: genCat.id,
        pub: pubDate(20),
        sub: daysOffset(-3), // Missed deadline! (3 days past)
        assignee: salesUser.id,
        status: 'identified',
        value: 3200000,
        portal: 'GeM',
        url: 'https://gem.gov.in/crpf-access-016',
        remarks: 'MISSED DEADLINE: Deadline elapsed without internal approval submission. Pending corrigendum extension.',
        checklist: false,
      },
    ];

    console.log(`📝 Inserting ${demoTenders.length} Demo Tenders...`);

    for (const t of demoTenders) {
      const res = await client.query(`
        INSERT INTO tenders (
          tender_number, tender_no, organisation, department, product_id,
          city, state, zone_id, region_id, category_id,
          publication_date, submission_deadline, assigned_to, assigned_person_id,
          owner, status, on_hold, status_before_hold, prep_checklist_done,
          estimated_value, portal, tender_url, remarks, extra_fields,
          version, is_deleted, created_by, created_at, updated_at, last_activity_at
        ) VALUES (
          $1, $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22,
          1, false, $13, NOW(), NOW(), NOW()
        ) RETURNING id, tender_number, status;
      `, [
        t.num, t.org, t.dept, t.prod,
        t.city, t.state, t.zone, t.region, t.cat,
        t.pub, t.sub, t.assignee,
        mgmtUser.id, t.status, t.on_hold || false, t.status_before_hold || null, t.checklist,
        t.value, t.portal, t.url, t.remarks,
        JSON.stringify({ is_historical: true })
      ]);

      const tenderId = res.rows[0].id;

      // Status History
      await client.query(`
        INSERT INTO tender_status_history (
          tender_id, from_status, to_status, changed_by, note, changed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW());
      `, [tenderId, 'IDENTIFIED', t.status.toUpperCase(), mgmtUser.id, `Initial progression to ${t.status}`]);

      // Approval Record if Awaiting
      if (t.status === 'awaiting_approval') {
        await client.query(`
          INSERT INTO tender_approvals (
            tender_id, requested_by, requested_at, status, remarks
          ) VALUES ($1, $2, NOW(), 'PENDING', 'Requested participation approval');
        `, [tenderId, salesUser.id]);
      }

      // Portal Issue Record
      if (t.hasPortalIssue) {
        await client.query(`
          INSERT INTO tender_portal_issues (
            tender_id, portal, issue, issue_date, reported_date,
            reported_by, responsible_user, responsible_person_id,
            status, resolution_status
          ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE, $4, $5, $5, 'OPEN', 'OPEN');
        `, [
          tenderId, t.portal,
          'GeM Server 502 Bad Gateway during technical bid PDF upload',
          salesUser.id, salesUser.id
        ]);
      }

      // Result Record for Won / Lost
      if (t.isWon) {
        // Record prior submission history so result constraints pass
        await client.query(`
          INSERT INTO tender_status_history (tender_id, from_status, to_status, changed_by, note, changed_at)
          VALUES ($1, 'UNDER_PREPARATION', 'TENDER_SUBMITTED', $2, 'Bid submitted', NOW() - INTERVAL '15 days');
        `, [tenderId, salesUser.id]);

        await client.query(`
          INSERT INTO tender_results (
            tender_id, outcome, result_date, value, competitor, notes,
            zone_id, region_id, assigned_to, category_id, product_id
          ) VALUES ($1, 'WON', CURRENT_DATE - 2, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          tenderId, t.wonValue, t.competitor, 'Awarded contract post financial opening',
          t.zone, t.region, t.assignee, t.cat, t.prod
        ]);
      }

      if (t.isLost) {
        await client.query(`
          INSERT INTO tender_status_history (tender_id, from_status, to_status, changed_by, note, changed_at)
          VALUES ($1, 'UNDER_PREPARATION', 'TENDER_SUBMITTED', $2, 'Bid submitted', NOW() - INTERVAL '20 days');
        `, [tenderId, salesUser.id]);

        await client.query(`
          INSERT INTO tender_results (
            tender_id, outcome, result_date, value, loss_reasons, competitor, notes,
            zone_id, region_id, assigned_to, category_id, product_id
          ) VALUES ($1, 'LOST', CURRENT_DATE - 5, NULL, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          tenderId, t.lossReasons, t.competitor, t.remarks,
          t.zone, t.region, t.assignee, t.cat, t.prod
        ]);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded 16 realistic Module 4 demo tenders into database!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Module 4 tenders:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1].endsWith('seed_module4_tenders.ts')) {
  seedModule4Tenders()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
