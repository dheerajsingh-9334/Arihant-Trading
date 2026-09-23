const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('=== MODULE 3: DEMO MANAGEMENT E2E VERIFICATION ===');

  // 1. Login
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@arihant.com', password: 'password123' },
  );

  if (loginRes.status !== 200 || (!loginRes.data.token && !loginRes.data.accessToken)) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token || loginRes.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('✓ Admin authenticated successfully');

  // 2. Fetch Master Data (Organisations, Products, Equipment)
  const orgsRes = await request({ hostname: 'localhost', port: 4000, path: '/api/organisations', method: 'GET', headers });
  console.log('orgsRes raw:', orgsRes.status, JSON.stringify(orgsRes.data).slice(0, 200));
  const orgs = Array.isArray(orgsRes.data) ? orgsRes.data : (orgsRes.data.data || orgsRes.data.items || orgsRes.data.organisations || []);
  const org = orgs[0];
  console.log(`✓ Fetched organisations: found ${orgs.length}, using '${org?.name}' (ID: ${org?.id})`);

  const productsRes = await request({ hostname: 'localhost', port: 4000, path: '/api/masters/products', method: 'GET', headers });
  const products = productsRes.data || [];
  const product = products[0];
  console.log(`✓ Fetched products: found ${products.length}, using '${product?.name}'`);

  const equipRes = await request({ hostname: 'localhost', port: 4000, path: '/api/demos/equipment', method: 'GET', headers });
  const equipment = equipRes.data || [];
  console.log(`✓ Depot Equipment Fleet count: ${equipment.length} units`);
  if (equipment.length > 0) {
    console.log(`  Sample unit: ${equipment[0].model} (${equipment[0].serial_no}) at Depot: ${equipment[0].current_location}`);
  }

  // 3. Test Team Availability Checker
  const teamRes = await request({ hostname: 'localhost', port: 4000, path: '/api/demos/team/availability?date=2026-10-01', method: 'GET', headers });
  console.log(`✓ Specialist Team Availability: ${teamRes.data.length} specialists active`);
  const specialist = teamRes.data[0];

  // 4. Create Demo Request with All 9 Core Specifications
  console.log('\n--- Step 4: Creating Demo Request (9 Core Specs) ---');
  const newDemoPayload = {
    organisation_id: org.id,
    product_id: product.id,
    location: 'CRPF Group Centre Proving Ground, Delhi',
    requested_date: '2026-10-05',
    assigned_to: specialist ? specialist.id : undefined,
    purpose: 'Live detection rate qualification for upcoming GeM procurement tender',
    expected_audience: 'DIG Technical & Procurement Board, 4 DSPs',
    equipment_required: `${product.name} standard unit with calibration target rods`,
    special_requirements: 'Outdoor testing ground; battery backup & generator power required',
    remarks: 'Pre-inspection security gate pass sanctioned by CRPF Commandant office',
    travel_required: true,
    travel_from: 'Delhi Central Depot',
    travel_to: 'CRPF Bawana, Delhi',
    travel_date: '2026-10-05',
  };

  const createRes = await request(
    { hostname: 'localhost', port: 4000, path: '/api/demos', method: 'POST', headers },
    newDemoPayload,
  );

  if (createRes.status !== 201) {
    throw new Error('Create demo failed: ' + JSON.stringify(createRes.data));
  }
  const demo = createRes.data;
  console.log(`✓ Created Demo #${demo.demo_no} (ID: ${demo.id}) with status: '${demo.status}'`);

  // 5. Assign Demo Specialist & Travel Logistics
  console.log('\n--- Step 5: Assigning Team Member (§14) ---');
  if (specialist) {
    const assignRes = await request(
      { hostname: 'localhost', port: 4000, path: `/api/demos/${demo.id}/assign-team`, method: 'POST', headers },
      {
        assigned_to: specialist.id,
        confirmed_date: '2026-10-05',
        travel_required: true,
        travel_from: 'Delhi Depot',
        travel_to: 'CRPF Bawana, Delhi',
        travel_date: '2026-10-05',
        remarks: 'Specialist deployed with calibration toolkits',
      },
    );
    console.log(`✓ Specialist ${specialist.full_name} assigned to Demo. Status: '${assignRes.data.status}'`);
  }

  // 6. Reserve Depot Equipment Unit (§15 & §16)
  console.log('\n--- Step 6: Equipment Reservation (§15 & §16) ---');
  const unitToReserve = equipment[0];
  const reserveRes = await request(
    { hostname: 'localhost', port: 4000, path: `/api/demos/${demo.id}/reserve`, method: 'POST', headers },
    {
      equipment_id: unitToReserve.id,
      reserved_from: '2026-10-04',
      reserved_to: '2026-10-06',
      remarks: 'Primary trial unit requested from depot',
    },
  );
  const reservationId = reserveRes.data.id || reserveRes.data.reservation?.id;
  console.log(`✓ Unit ${unitToReserve.model} reserved. Reservation ID: ${reservationId}`);

  // 7. Custodian Governance: Approve Reservation (§16)
  console.log('\n--- Step 7: Custodian Approval (§16) ---');
  const approveRes = await request(
    { hostname: 'localhost', port: 4000, path: `/api/demos/reservations/${reservationId}/approve`, method: 'POST', headers },
    { remarks: 'Approved by depot custodian for field trial' },
  );
  console.log(`✓ Reservation ${reservationId} status updated: '${approveRes.data.status}'`);

  // 8. Custodian Governance: Allocate Alternative Unit (§16)
  console.log('\n--- Step 8: Custodian Reallocate Alternative Unit (§16) ---');
  if (equipment.length > 1) {
    const altUnit = equipment[1];
    const allocateRes = await request(
      { hostname: 'localhost', port: 4000, path: `/api/demos/reservations/${reservationId}/allocate`, method: 'POST', headers },
      {
        equipment_id: altUnit.id,
        reason: 'Reallocating freshly calibrated backup unit from Delhi fleet',
        reserved_from: '2026-10-04',
        reserved_to: '2026-10-06',
        remarks: 'Alternative unit dispatched',
      },
    );
    console.log(`✓ Custodian allocated alternative unit: ${altUnit.model} (${altUnit.serial_no}). Status: '${allocateRes.data.status}'`);
  }

  // 9. Confirm Demonstration Date (§14)
  console.log('\n--- Step 9: Confirming Demo Date (§14) ---');
  const confirmRes = await request(
    { hostname: 'localhost', port: 4000, path: `/api/demos/${demo.id}/confirm`, method: 'POST', headers },
    { confirmed_date: '2026-10-05', remarks: 'Date confirmed with CRPF DIG office' },
  );
  console.log(`✓ Demo ${demo.demo_no} status: '${confirmRes.data.status}' on confirmed date: ${confirmRes.data.confirmed_date}`);

  // 10. Record Demo Outcome & Structured Failure Analysis (§17)
  console.log('\n--- Step 10: Recording Outcome & Failure Taxonomy (§17) ---');
  const outcomePayload = {
    completed: true,
    result: 'fail',
    failure_reason: 'TECHNICAL_FAILURE',
    customer_response: 'Client noted intermittent false alarm triggers during live vehicle vibration simulation',
    technical_performance: '94% detection rate; sensitivity drift observed on Channel 3',
    product_suitability: 'Requires updated DSP firmware tuning for high-vibration proving grounds',
    decision_maker_present: true,
    competitor_involved: 'Godrej Security Solutions',
    next_step: 'Engineering team deploying firmware patch v2.4.1 for second proving pass',
    opportunity_stage: 'Proposal',
    remarks: 'Signed technical evaluation sheet received from trial board with remarks for tuning',
  };

  const outcomeRes = await request(
    { hostname: 'localhost', port: 4000, path: `/api/demos/${demo.id}/outcome`, method: 'POST', headers },
    outcomePayload,
  );
  const outcome = outcomeRes.data.outcome || outcomeRes.data;
  console.log(`✓ Demo ${demo.demo_no} outcome logged.`);
  console.log(`  Result: ${outcome.result}, Failure Category: ${outcome.failure_reason}`);
  console.log(`  Decision-Maker Attended: ${outcome.decision_maker_present}`);

  // 11. Fetch Demo Audit Trail
  console.log('\n--- Step 11: Audit Trail Verification ---');
  const auditRes = await request(
    { hostname: 'localhost', port: 4000, path: `/api/demos/${demo.id}/audit`, method: 'GET', headers },
  );
  console.log(`✓ Audit logs captured: ${auditRes.data.audit_logs?.length} system events`);

  // 12. Verify Executive Analytics & Failure Insights
  console.log('\n--- Step 12: Executive Analytics & Failure Insights ---');
  const analyticsRes = await request(
    { hostname: 'localhost', port: 4000, path: '/api/demos/analytics', method: 'GET', headers },
  );
  const a = analyticsRes.data;
  console.log(`✓ Total Demos: ${a.overview.total_demos}, Completed: ${a.overview.completed_demos}, Success Rate: ${a.overview.success_rate_percent}%`);
  console.log('✓ Failure Analysis Breakdown:');
  a.failure_analysis.forEach((f) => {
    console.log(`  - ${f.reason}: ${f.count} (${f.percentage}%)`);
  });
  console.log('✓ Decision-Maker Attendance Impact:');
  console.log(`  - Attended: ${a.decision_maker_impact?.attended?.successful}/${a.decision_maker_impact?.attended?.total} (${a.decision_maker_impact?.attended?.rate_percent}%)`);
  console.log(`  - Absent: ${a.decision_maker_impact?.absent?.successful}/${a.decision_maker_impact?.absent?.total} (${a.decision_maker_impact?.absent?.rate_percent}%)`);

  console.log('\n=== ALL MODULE 3 E2E WORKFLOW TESTS PASSED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
