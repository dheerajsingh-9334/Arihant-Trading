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
  console.log('--- 1. Login as Admin/Management ---');
  const login = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'mgmt@arihant.com', password: 'password123' });
  const token = login.data?.token;

  console.log('--- 2. Fetch organisation ID ---');
  const orgsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/organisations?limit=1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const orgId = orgsRes.data?.data?.[0]?.id;
  console.log('Found orgId:', orgId);

  console.log('\n--- 3. Testing POST /api/demos with empty visit_id: "" (should succeed, not throw 400) ---');
  const createRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/demos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, {
    organisation_id: orgId,
    product_id: '',
    location: 'Patna HQ',
    requested_date: '2026-10-15',
    assigned_to: '',
    purpose: 'Validation of empty visit_id handling',
    expected_audience: 'Officers',
    equipment_required: 'Thermal Scope',
    special_requirements: 'None',
    remarks: 'Auto-tested',
    visit_id: '',
    travel_required: false,
  });

  console.log('Create Demo response status:', createRes.status);
  if (createRes.status === 201) {
    console.log(' Demo created successfully! Demo No:', createRes.data?.demo_no);
    console.log('visit_id stored in DB:', createRes.data?.visit_id);
  } else {
    console.error(' Failed! Response:', createRes.data);
    process.exit(1);
  }
}

run().catch(console.error);
