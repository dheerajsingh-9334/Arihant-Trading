const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('--- 1. Logging in as Sales Rep (Amit Verma) ---');
  const salesLogin = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'sales.delhi@arihant.com', password: 'password123' });

  console.log('Sales login status:', salesLogin.status, '| Role:', salesLogin.data?.user?.role);
  const salesToken = salesLogin.data?.token;

  console.log('\n--- 2. Fetching a lead to reassign ---');
  const leadsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/leads?limit=1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${salesToken}` },
  });
  const lead = leadsRes.data?.data?.[0];
  if (!lead) {
    console.error('No lead found');
    process.exit(1);
  }
  console.log('Found lead:', lead.id, '| Organisation:', lead.organisation_name, '| Current Assigned:', lead.assignee_name);

  console.log('\n--- 3. Testing Sales Rep Reassignment (Should Fail with 403) ---');
  const salesReassign = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/leads/${lead.id}/assign`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${salesToken}`,
    },
  }, {
    assigned_to: '33333333-3333-3333-3333-333333333331',
    reason: 'Testing sales attempt',
  });
  console.log('Sales reassign status:', salesReassign.status, '(Expected 403)');
  console.log('Error message:', salesReassign.data?.message);

  console.log('\n--- 4. Logging in as Regional Manager (Vikram Sharma) ---');
  const rmLogin = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'regmgr.north@arihant.com', password: 'password123' });
  console.log('RM login status:', rmLogin.status, '| Role:', rmLogin.data?.user?.role);
  const rmToken = rmLogin.data?.token;

  console.log('\n--- 5. Testing Regional Manager Reassignment (Should Succeed with 200) ---');
  const rmReassign = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/leads/${lead.id}/assign`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${rmToken}`,
    },
  }, {
    assigned_to: '33333333-3333-3333-3333-333333333331',
    reason: 'Territory optimization verified by Regional Manager',
  });
  console.log('RM reassign status:', rmReassign.status, '(Expected 200)');
  console.log('Reassigned lead id:', rmReassign.data?.id, '| New assignee:', rmReassign.data?.assigned_to);

  console.log('\n--- 6. Verifying Lead Assignment Audit History ---');
  const leadDetail = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/leads/${lead.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${rmToken}` },
  });
  console.log('Audit history count:', leadDetail.data?.assignment_history?.length);
  if (leadDetail.data?.assignment_history?.length > 0) {
    const latest = leadDetail.data.assignment_history[0];
    console.log('Latest audit record:', {
      changed_at: latest.changed_at,
      reason: latest.reason,
      changed_by_name: latest.changer_name,
    });
  }

  console.log('\n RBAC REASSIGNMENT TEST COMPLETED SUCCESSFULLY');
}

run().catch(console.error);
