#!/usr/bin/env python3
import json
import uuid

def req(name, method, url_path, query_params=None, body=None, description="", is_public=False, test_script=None, auth_override=None):
    raw_url = "{{baseUrl}}" + url_path
    path_segments = [p for p in url_path.strip("/").split("/") if p]
    
    url_obj = {
        "raw": raw_url,
        "host": ["{{baseUrl}}"],
        "path": path_segments
    }
    
    if query_params:
        query_list = []
        param_strs = []
        for q in query_params:
            item = {
                "key": q.get("key"),
                "value": str(q.get("value", "")),
                "description": q.get("desc", ""),
                "disabled": q.get("disabled", False)
            }
            query_list.append(item)
            if not q.get("disabled", False):
                param_strs.append(f"{q['key']}={q.get('value', '')}")
        url_obj["query"] = query_list
        if param_strs:
            url_obj["raw"] = raw_url + "?" + "&".join(param_strs)

    request_obj = {
        "method": method,
        "header": [
            {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
            }
        ],
        "url": url_obj,
        "description": description
    }

    if is_public:
        request_obj["auth"] = {
            "type": "noauth"
        }
    elif auth_override:
        request_obj["auth"] = auth_override

    if body is not None and method in ["POST", "PATCH", "PUT"]:
        request_obj["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2),
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        }

    item = {
        "name": name,
        "request": request_obj
    }

    if test_script:
        item["event"] = [
            {
                "listen": "test",
                "script": {
                    "exec": test_script,
                    "type": "text/javascript"
                }
            }
        ]

    return item

collection = {
    "info": {
        "_postman_id": str(uuid.uuid4()),
        "name": "Arihant Trading Corporation BOS - Complete API & Edge Cases Collection",
        "description": "Exhaustive, production-grade Postman collection covering all BOS modules defined in the Arihant BOS Scope Blueprint.\n\nFeatures:\n- Complete lifecycle covering both happy paths and closing transitions.\n- Automatic token capture and variable chaining for Postman Collection Runner.\n- Comprehensive 'Edge Cases, RBAC Denials & Validations' test suite.\n- Exact field names matching NestJS DTOs and PostgreSQL schema.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "auth": {
        "type": "bearer",
        "bearer": [
            {
                "key": "token",
                "value": "{{token}}",
                "type": "string"
            }
        ]
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:4000/api", "type": "string"},
        {"key": "token", "value": "", "type": "string"},
        {"key": "mgmtToken", "value": "", "type": "string"},
        {"key": "rmToken", "value": "", "type": "string"},
        {"key": "salesToken", "value": "", "type": "string"},
        {"key": "tenderToken", "value": "", "type": "string"},
        {"key": "demoToken", "value": "", "type": "string"},
        {"key": "serviceToken", "value": "", "type": "string"},
        {"key": "accountsToken", "value": "", "type": "string"},
        {"key": "adminToken", "value": "", "type": "string"},
        {"key": "sampleTenderId", "value": "998db1d7-9f08-4880-89d7-b56a38faae5c", "type": "string"},
        {"key": "sampleOrgId", "value": "81e82c8c-f3e1-4ec8-929e-813cd17574ec", "type": "string"},
        {"key": "sampleContactId", "value": "", "type": "string"},
        {"key": "sampleProductId", "value": "db0af0a0-26dc-4a21-a006-d0cd319c18c7", "type": "string"},
        {"key": "sampleVisitId", "value": "b69080a2-993a-4762-99d5-7f92787a281f", "type": "string"},
        {"key": "sampleDemoId", "value": "e51c8a5c-3c8f-47a0-bcda-4ff922cc7039", "type": "string"},
        {"key": "sampleEquipmentId", "value": "b530d88f-8fa1-44c1-ae34-c9325376ae8f", "type": "string"},
        {"key": "sampleExpenseId", "value": "bef51e8a-1ea0-4caa-98d7-2fb5da7e3e25", "type": "string"},
        {"key": "sampleTaskId", "value": "afef37c9-32bb-4e83-9098-cb26a10e93d6", "type": "string"},
        {"key": "sampleBlockerId", "value": "bef683bd-a4d2-422e-9972-5a150d684f59", "type": "string"},
        {"key": "sampleTicketId", "value": "fae4fd1c-2116-4331-863b-829902f2a48a", "type": "string"},
        {"key": "sampleProposalId", "value": "", "type": "string"},
        {"key": "sampleLeadId", "value": "", "type": "string"},
        {"key": "sampleUserId", "value": "11111111-1111-1111-1111-111111111111", "type": "string"}
    ],
    "item": [
        {
            "name": "1. Authentication & Role Sessions",
            "item": [
                req(
                    "Login as Regional Manager (North) -> Sets {{rmToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "regmgr.north@arihant.com", "password": "password123"},
                    description="Logs in as Vikram Sharma (Regional Manager North).",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('rmToken', token); }"
                    ]
                ),
                req(
                    "Login as Sales Executive (Delhi) -> Sets {{salesToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "sales.delhi@arihant.com", "password": "password123"},
                    description="Logs in as Amit Verma (Sales Delhi).",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('salesToken', token); }"
                    ]
                ),
                req(
                    "Login as Tender Team Lead -> Sets {{tenderToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "tender@arihant.com", "password": "password123"},
                    description="Logs in as Suresh Nair (Tender Lead).",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('tenderToken', token); }"
                    ]
                ),
                req(
                    "Login as Demo Specialist -> Sets {{demoToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "demo@arihant.com", "password": "password123"},
                    description="Logs in as Demo Coordinator.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('demoToken', token); }"
                    ]
                ),
                req(
                    "Login as Service Engineer -> Sets {{serviceToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "service@arihant.com", "password": "password123"},
                    description="Logs in as Service Team Engineer.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('serviceToken', token); }"
                    ]
                ),
                req(
                    "Login as Corporate Accounts -> Sets {{accountsToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "accounts@arihant.com", "password": "password123"},
                    description="Logs in as Accounts Head for Stage-2 expense disbursements.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('accountsToken', token); }"
                    ]
                ),
                req(
                    "Login as System Admin -> Sets {{adminToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "admin@arihant.com", "password": "password123"},
                    description="Logs in as System Admin.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) { pm.collectionVariables.set('adminToken', token); }"
                    ]
                ),
                req(
                    "Login as Management -> Sets Default Runner Token {{token}} & {{mgmtToken}}",
                    "POST",
                    "/auth/login",
                    body={"email": "mgmt@arihant.com", "password": "password123"},
                    description="Logs in as Rajesh Arihant (Top Management). Keeps default {{token}} set to management so the entire collection runs cleanly.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "var jsonData = pm.response.json();",
                        "pm.test('Token exists', () => {",
                        "    pm.expect(jsonData.accessToken || jsonData.token).to.be.a('string');",
                        "});",
                        "var token = jsonData.accessToken || jsonData.token;",
                        "if (token) {",
                        "    pm.collectionVariables.set('token', token);",
                        "    pm.collectionVariables.set('mgmtToken', token);",
                        "    console.log('Default Management token set successfully!');",
                        "}"
                    ]
                ),
                req(
                    "Get Current Authenticated User (Me)",
                    "GET",
                    "/auth/me",
                    description="Returns profile and active role of the authenticated session.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "pm.test('User ID returned', () => pm.expect(pm.response.json().id).to.be.a('string'));"
                    ]
                ),
                req(
                    "Logout (Invalidate Session)",
                    "POST",
                    "/auth/logout",
                    description="Completes the auth lifecycle.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                )
            ]
        },
        {
            "name": "2. Executive Command Dashboard",
            "item": [
                req(
                    "Get Aggregated Executive Metrics & Exceptions",
                    "GET",
                    "/dashboard/metrics",
                    description="Returns live KPIs (tenders, leads, tasks, expenses, tickets) and critical exception queue.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));",
                        "pm.test('Metrics object received', () => {",
                        "    var res = pm.response.json();",
                        "    pm.expect(res).to.have.property('tendersCount');",
                        "    pm.expect(res).to.have.property('recentExceptions');",
                        "});"
                    ]
                )
            ]
        },
        {
            "name": "3. Tenders (GeM Pipeline)",
            "item": [
                req(
                    "List All Tenders (Paginated & Filtered)",
                    "GET",
                    "/tenders",
                    query_params=[
                        {"key": "page", "value": "1", "desc": "Page number"},
                        {"key": "limit", "value": "20", "desc": "Rows per page"},
                        {"key": "category", "value": "general_mha", "desc": "Filter by 'general_mha', 'pq', or 'other'", "disabled": True},
                        {"key": "status", "value": "under_preparation", "desc": "Filter by tender status", "disabled": True},
                        {"key": "search", "value": "CRPF", "desc": "Search text in tender no, org, or requirement", "disabled": True}
                    ],
                    description="Fetches tenders list scoped to the logged-in user's role.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Filter Tenders Closing Soon (Within 7 Days)",
                    "GET",
                    "/tenders",
                    query_params=[
                        {"key": "closingSoonOnly", "value": "true", "desc": "Filters tenders closing within 7 days"}
                    ],
                    description="Critical urgency filter highlighting bids requiring immediate submission.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Get Tender Pipeline Summary Stats",
                    "GET",
                    "/tenders/stats",
                    description="Aggregated counts by status.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Create New Tender (by Tender Lead -> Captures {{sampleTenderId}})",
                    "POST",
                    "/tenders",
                    body={
                        "tender_no": "GEM/2026/B/" + str(uuid.uuid4())[:8],
                        "organisation_id": "{{sampleOrgId}}",
                        "department": "BSF Communications Branch",
                        "product_id": "{{sampleProductId}}",
                        "requirement_text": "Procurement of 120 Units Hand Held Metal Detectors as per MHA QR",
                        "city": "New Delhi",
                        "state": "Delhi",
                        "category": "general_mha",
                        "quantity": 120,
                        "emd_fee": 150000,
                        "bid_closing_date": "2026-09-28T14:30:00.000Z",
                        "status": "awaiting_approval",
                        "remarks": "Priority border security requirements"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{tenderToken}}", "type": "string"}]
                    },
                    description="Registers a new tender and automatically captures ID for subsequent lifecycle calls.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) {",
                        "    pm.collectionVariables.set('sampleTenderId', res.id);",
                        "}"
                    ]
                ),
                req(
                    "Get Tender by ID",
                    "GET",
                    "/tenders/{{sampleTenderId}}",
                    description="Fetches full details of the created/selected tender.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Edit Tender Details (Corrigendum / Extension)",
                    "PATCH",
                    "/tenders/{{sampleTenderId}}",
                    body={
                        "bid_closing_date": "2026-10-05T14:30:00.000Z",
                        "corrigendum_date": "2026-09-16",
                        "remarks": "Corrigendum-1 issued: Bid submission extended by 7 days"
                    },
                    description="Updates deadlines and corrigendum modifications on GeM.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Approve Tender Participation (Independent Management Review)",
                    "POST",
                    "/tenders/{{sampleTenderId}}/approve",
                    body={
                        "decision": "approved",
                        "remarks": "Approved by management. Ensure EMD bank guarantee is ready."
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{mgmtToken}}", "type": "string"}]
                    },
                    description="Sign-off by Management or Regional Manager. Enforces non-self-approval rule.",
                    test_script=[
                        "pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"
                    ]
                ),
                req(
                    "Update Tender Status to 'submitted'",
                    "PATCH",
                    "/tenders/{{sampleTenderId}}/status",
                    body={
                        "status": "submitted",
                        "remarks": "Technical and financial bids uploaded on GeM portal."
                    },
                    description="Advances the tender status in the pipeline.",
                    test_script=[
                        "pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"
                    ]
                ),
                req(
                    "Record Tender Outcome (Win/Loss Intelligence)",
                    "POST",
                    "/tenders/{{sampleTenderId}}/outcome",
                    body={
                        "result": "lost",
                        "reason": "L1 quoted 7% lower price on sensor module replacement warranty",
                        "competitor": "Smiths Detection India Ltd",
                        "value_lakh": 182.5,
                        "result_date": "2026-09-16T11:00:00.000Z"
                    },
                    description="Records post-bid result, competitor intelligence, and root cause.",
                    test_script=[
                        "pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"
                    ]
                )
            ]
        },
        {
            "name": "4. Field Visits & Planning",
            "item": [
                req(
                    "List Visits",
                    "GET",
                    "/visits",
                    query_params=[
                        {"key": "page", "value": "1"},
                        {"key": "limit", "value": "20"},
                        {"key": "status", "value": "planned", "disabled": True}
                    ],
                    description="Lists planned and completed visits.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create Planned Visit (Captures {{sampleVisitId}})",
                    "POST",
                    "/visits",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "location": "Force HQ BSF, CGO Complex, Lodhi Road, New Delhi",
                        "planned_date": "2026-09-21T10:30:00.000Z",
                        "purpose": "Presentation on Hand Held Metal Detector MHA QR Compliance",
                        "demo_required": True,
                        "travel_required": False,
                        "expected_outcome": "Demo trial date finalisation"
                    },
                    description="Creates a field visit itinerary and captures sampleVisitId.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleVisitId', res.id); }"
                    ]
                ),
                req(
                    "Get Visit by ID",
                    "GET",
                    "/visits/{{sampleVisitId}}",
                    description="Fetches visit details including manager interventions.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Add Manager 'Also-Meet' Directive (Section 10)",
                    "POST",
                    "/visits/{{sampleVisitId}}/intervention",
                    body={
                        "instructions": "Since you are already at CGO Complex, also meet DIG Provisioning at CISF HQ (Room 304) regarding pending baggage scanner tender."
                    },
                    description="Regional Manager instructs employee to meet another prospect during the same trip.",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                ),
                req(
                    "Submit Post-Visit Completion Report (Section 12)",
                    "POST",
                    "/visits/{{sampleVisitId}}/update",
                    body={
                        "met_completed": True,
                        "person_met": "Shri V.K. Singh, Commandant (Telecom)",
                        "discussion": "Demonstrated sensitivity of detector. Discussed RF immunity features.",
                        "product_discussed": "HHMD-MHA-V2",
                        "outcome": "Successful meeting. Requested formal demonstration next week.",
                        "opportunity": "Trial procurement for 80 units",
                        "tender_opportunity": "Expected GeM bid in October 2026",
                        "next_action": "Coordinate with Demo team for depot unit allocation"
                    },
                    description="Submits the debrief report after completing the visit.",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                ),
                req(
                    "Reschedule Visit",
                    "PATCH",
                    "/visits/{{sampleVisitId}}/status",
                    body={
                        "status": "rescheduled",
                        "change_reason": "Officer travelling on border inspection",
                        "rescheduled_to": "2026-09-25T11:00:00.000Z"
                    },
                    description="Reschedules visit and records reason into audit trail.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "5. Demos & Equipment Fleet",
            "item": [
                req(
                    "Check Demo Equipment Fleet Matrix (Tri-City)",
                    "GET",
                    "/demos/equipment",
                    query_params=[
                        {"key": "location", "value": "Delhi", "desc": "Filter by depot: Delhi, Patna, Kolkata", "disabled": True},
                        {"key": "status", "value": "available", "desc": "Filter by availability status", "disabled": True}
                    ],
                    description="Lists all demo units across Delhi, Patna, and Kolkata depots.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Register Demo Equipment Unit (Captures {{sampleEquipmentId}})",
                    "POST",
                    "/demos/equipment",
                    body={
                        "product_id": "{{sampleProductId}}",
                        "model": "HHMD Ultra 3000",
                        "serial_no": "HHMD-DEL-" + str(uuid.uuid4())[:6].upper(),
                        "current_location": "Delhi",
                        "condition": "Excellent",
                        "remarks": "Brand new demo unit with IP67 casing"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{demoToken}}", "type": "string"}]
                    },
                    description="Adds a unit to the equipment depot inventory (Demo Team).",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleEquipmentId', res.id); }"
                    ]
                ),
                req(
                    "Request a Demonstration (Captures {{sampleDemoId}})",
                    "POST",
                    "/demos",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "product_id": "{{sampleProductId}}",
                        "location": "Delhi",
                        "requested_date": "2026-09-24T10:00:00.000Z",
                        "purpose": "Field demonstration before technical committee",
                        "expected_audience": "Commandant, Dy Commandant, 4 Technical Inspectors",
                        "equipment_required": "1x HHMD Demo Unit with test targets",
                        "special_requirements": "Outdoor testing in rain simulation"
                    },
                    description="Salesperson submits a demonstration request.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleDemoId', res.id); }"
                    ]
                ),
                req(
                    "Get Demo Details by ID",
                    "GET",
                    "/demos/{{sampleDemoId}}",
                    description="Fetches demo request and equipment allocation details.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Reserve Equipment for Demo",
                    "POST",
                    "/demos/{{sampleDemoId}}/reserve",
                    body={
                        "equipment_id": "{{sampleEquipmentId}}",
                        "reserved_from": "2026-09-24T09:00:00.000Z",
                        "reserved_to": "2026-09-24T17:00:00.000Z"
                    },
                    description="Locks equipment unit using exact schema fields (reserved_from, reserved_to).",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                ),
                req(
                    "Record Demo Outcome (Success)",
                    "POST",
                    "/demos/{{sampleDemoId}}/outcome",
                    body={
                        "completed": True,
                        "result": "success",
                        "customer_response": "Technical committee fully satisfied with detection range",
                        "technical_performance": "100% detection rate on copper and composite targets",
                        "product_suitability": "Ideal for border outpost gate control",
                        "decision_maker_present": True,
                        "next_step": "Submit formal commercial quotation"
                    },
                    description="Records trial success using exact schema field names.",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                ),
                req(
                    "Record Demo Outcome (Failure & Root Cause Analysis)",
                    "POST",
                    "/demos/{{sampleDemoId}}/outcome",
                    body={
                        "completed": True,
                        "result": "fail",
                        "failure_reason": "customer_requirement_mismatch",
                        "customer_response": "Client requires wireless PC logging dock which is an optional add-on",
                        "technical_performance": "Met all hardware requirements",
                        "decision_maker_present": True,
                        "next_step": "Submit commercial proposal for wireless dock upgrade"
                    },
                    description="Records root-cause failure analysis (Section 17).",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                )
            ]
        },
        {
            "name": "6. Two-Stage Expense Approvals",
            "item": [
                req(
                    "List Expenses (Filter by Approval Status)",
                    "GET",
                    "/expenses",
                    query_params=[
                        {"key": "status", "value": "submitted", "desc": "submitted, manager_approved, accounts_processed, rejected", "disabled": True},
                        {"key": "category", "value": "travel", "disabled": True}
                    ],
                    description="Fetches expense claims.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Submit Expense Claim (by Sales Rep -> Captures {{sampleExpenseId}})",
                    "POST",
                    "/expenses",
                    body={
                        "visit_id": "{{sampleVisitId}}",
                        "organisation_id": "{{sampleOrgId}}",
                        "expense_date": "2026-09-16",
                        "category": "travel",
                        "amount": 3850,
                        "purpose": "Cab and metro conveyance for client demonstration at BSF HQ",
                        "receipt_url": "https://arihant-storage.com/receipts/cab_claim_0916.pdf",
                        "remarks": "Attached Uber business invoices"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{salesToken}}", "type": "string"}]
                    },
                    description="Employee submits a new standardized expense claim.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleExpenseId', res.id); }"
                    ]
                ),
                req(
                    "Get Expense by ID",
                    "GET",
                    "/expenses/{{sampleExpenseId}}",
                    description="Fetches detailed claim with receipt URL.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Stage 1: Regional Manager Approval",
                    "PATCH",
                    "/expenses/{{sampleExpenseId}}/manager-approve",
                    body={
                        "decision": "manager_approved",
                        "manager_remarks": "Verified against visit itinerary. Legitimate claim."
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{rmToken}}", "type": "string"}]
                    },
                    description="Regional Manager approves claim.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Stage 2: Accounts Head Final Disbursement",
                    "PATCH",
                    "/expenses/{{sampleExpenseId}}/accounts-process",
                    body={
                        "decision": "accounts_processed",
                        "remarks": "Reimbursed via IMPS. Tally Voucher Ref: BKP-2026-9812"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{accountsToken}}", "type": "string"}]
                    },
                    description="Corporate Accounts marks processed with Tally voucher reference.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "7. Tasks & Blocker Escalation",
            "item": [
                req(
                    "List Tasks",
                    "GET",
                    "/tasks",
                    query_params=[
                        {"key": "status", "value": "in_progress", "disabled": True},
                        {"key": "priority", "value": "high", "disabled": True},
                        {"key": "overdue_only", "value": "true", "disabled": True}
                    ],
                    description="Lists tasks across departments.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create Milestone Task (Captures {{sampleTaskId}})",
                    "POST",
                    "/tasks",
                    body={
                        "title": "Complete Pre-Bid Technical Compliance for CRPF Tender",
                        "description": "Cross-reference MHA QRs clause by clause with OEM datasheet",
                        "priority": "critical",
                        "deadline": "2026-09-20T17:00:00.000Z"
                    },
                    description="Assigns a task and captures sampleTaskId.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleTaskId', res.id); }"
                    ]
                ),
                req(
                    "Get Task by ID",
                    "GET",
                    "/tasks/{{sampleTaskId}}",
                    description="Fetches task details and active blockers.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Raise Blocker Dependency (Captures {{sampleBlockerId}})",
                    "POST",
                    "/tasks/{{sampleTaskId}}/blockers",
                    body={
                        "blocker_type": "vendor",
                        "description": "OEM Technical team in Germany has not provided environmental testing certificate (MIL-STD-810H). Awaiting response."
                    },
                    description="Raises a blocker using valid enum ('vendor', 'customer', 'portal', etc.).",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleBlockerId', res.id); }"
                    ]
                ),
                req(
                    "Resolve Blocker (Decision: Accepted + New Deadline)",
                    "PATCH",
                    "/tasks/{{sampleTaskId}}/blockers/{{sampleBlockerId}}/resolve",
                    body={
                        "decision": "accepted",
                        "new_deadline": "2026-09-22T18:00:00.000Z"
                    },
                    description="Manager resolves blocker using valid DTO fields.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Mark Task as Completed (Close Task Lifecycle)",
                    "PATCH",
                    "/tasks/{{sampleTaskId}}",
                    body={
                        "status": "completed",
                        "evidence_url": "https://arihant-storage.com/evidence/task_completion_0916.pdf"
                    },
                    description="Closes the task lifecycle.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "8. Service & Breakdown Desk",
            "item": [
                req(
                    "List Service Tickets",
                    "GET",
                    "/service/tickets",
                    query_params=[
                        {"key": "status", "value": "assigned", "disabled": True},
                        {"key": "priority", "value": "critical", "disabled": True}
                    ],
                    description="Lists breakdown complaints.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Log Service Breakdown Complaint (Captures {{sampleTicketId}})",
                    "POST",
                    "/service/tickets",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "product_id": "{{sampleProductId}}",
                        "equipment_serial": "SN-DSMD-2024-110",
                        "complaint": "Search head sensitivity drifting during wet ground calibration",
                        "priority": "high",
                        "warranty_status": "in_warranty"
                    },
                    description="Logs an after-sales breakdown complaint using exact schema fields.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleTicketId', res.id); }"
                    ]
                ),
                req(
                    "Get Ticket by ID",
                    "GET",
                    "/service/tickets/{{sampleTicketId}}",
                    description="Fetches ticket history.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Progress Ticket Status ('in_progress')",
                    "PATCH",
                    "/service/tickets/{{sampleTicketId}}/status",
                    body={
                        "status": "in_progress",
                        "planned_visit_date": "2026-09-17T09:00:00.000Z"
                    },
                    description="Transitions ticket lifecycle toward rectification.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Submit Service Rectification Report (Closes Ticket)",
                    "POST",
                    "/service/tickets/{{sampleTicketId}}/report",
                    body={
                        "problem_identified": "Water ingress into coil connector seal causing impedance mismatch",
                        "action_taken": "Replaced weatherproof O-ring seal, cleaned contacts with isopropyl alcohol, recalibrated coil balance",
                        "parts_replaced": "Coil Seal Kit (Part #ATC-SK-11)",
                        "warranty_status": "in_warranty",
                        "customer_confirmation": True
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{serviceToken}}", "type": "string"}]
                    },
                    description="Service engineer files formal report using exact DTO fields.",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                )
            ]
        },
        {
            "name": "9. Commercial Proposals",
            "item": [
                req(
                    "List Proposals",
                    "GET",
                    "/proposals",
                    description="Lists quotations and proposals sent.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create Proposal Record (Captures {{sampleProposalId}})",
                    "POST",
                    "/proposals",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "product_id": "{{sampleProductId}}",
                        "sector": "paramilitary",
                        "version": "v1.0",
                        "reference": "ATC/PROP/2026/089",
                        "status": "requested",
                        "required_date": "2026-09-25",
                        "next_followup": "2026-09-22",
                        "remarks": "Formal commercial offer for 120 units HHMD with 3-year AMC"
                    },
                    description="Registers a commercial proposal.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleProposalId', res.id); }"
                    ]
                ),
                req(
                    "Get Proposal by ID",
                    "GET",
                    "/proposals/{{sampleProposalId}}",
                    description="Fetches proposal record.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Update Proposal Status & Follow-Up (Section 30)",
                    "PATCH",
                    "/proposals/{{sampleProposalId}}",
                    body={
                        "status": "followup_required",
                        "next_followup": "2026-09-23",
                        "remarks": "Called Procurement Officer. Technical committee review scheduled for Friday."
                    },
                    description="Updates proposal follow-up tracking.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "10. Organisations & Contacts (Module 1)",
            "item": [
                req(
                    "List Organisations",
                    "GET",
                    "/organisations",
                    query_params=[
                        {"key": "search", "value": "Police", "disabled": True},
                        {"key": "sector", "value": "defense", "disabled": True}
                    ],
                    description="Lists central client organisations.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Check Duplicate Organisation (Duplicate Prevention)",
                    "GET",
                    "/organisations/check-duplicate",
                    query_params=[
                        {"key": "name", "value": "Border Security Force"}
                    ],
                    description="Checks if an organisation already exists to prevent duplicate entries.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create Organisation (Captures {{sampleOrgId}})",
                    "POST",
                    "/organisations",
                    body={
                        "name": "Central Reserve Police Force HQ - Division " + str(uuid.uuid4())[:6],
                        "sector": "paramilitary",
                        "is_govt": True,
                        "city": "New Delhi",
                        "state": "Delhi",
                        "address": "Block 1, CGO Complex, Lodhi Road, New Delhi"
                    },
                    description="Creates an organisation and automatically updates {{sampleOrgId}}.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleOrgId', res.id); }"
                    ]
                ),
                req(
                    "Get Organisation by ID",
                    "GET",
                    "/organisations/{{sampleOrgId}}",
                    description="Fetches organisation profile.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Add Contact Person (Captures {{sampleContactId}})",
                    "POST",
                    "/contacts",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "full_name": "Shri Ashok Kumar",
                        "designation": "Deputy Inspector General (Procurement)",
                        "mobile": "+919871100223",
                        "email": "dig.procure." + str(uuid.uuid4())[:6] + "@bsf.gov.in",
                        "is_primary": True
                    },
                    description="Adds a contact person using exact schema column full_name.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleContactId', res.id); }"
                    ]
                ),
                req(
                    "List Contacts of Organisation",
                    "GET",
                    "/contacts",
                    query_params=[
                        {"key": "organisation_id", "value": "{{sampleOrgId}}"}
                    ],
                    description="Lists contacts for the organisation.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "11. Customer Interaction Timeline",
            "item": [
                req(
                    "Log Customer Interaction (Call / Visit / Demo)",
                    "POST",
                    "/interactions",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "type": "physical_visit",
                        "remarks": "Technical Committee Pre-Bid Discussion at CGO Complex",
                        "outcome": "Discussed clauses 4.2 and 4.7 of MHA specification. Client agreed to accept OEM test certificates.",
                        "next_action": "Submit bid documents before closing deadline",
                        "followup_date": "2026-09-22"
                    },
                    description="Appends an interaction using exact DTO fields (type, remarks, outcome, next_action).",
                    test_script=["pm.test('Status is 201 Created', () => pm.response.to.have.status(201));"]
                ),
                req(
                    "Get Organisation Interaction History Timeline",
                    "GET",
                    "/interactions",
                    query_params=[
                        {"key": "organisation_id", "value": "{{sampleOrgId}}"}
                    ],
                    description="Returns unified chronological history.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "12. Sales Leads & Funnel",
            "item": [
                req(
                    "Create Sales Lead (Captures {{sampleLeadId}})",
                    "POST",
                    "/leads",
                    body={
                        "organisation_id": "{{sampleOrgId}}",
                        "product_id": "{{sampleProductId}}",
                        "category": "active",
                        "probability": "high",
                        "channel": "direct",
                        "value_lakh": 48.5,
                        "status": "qualified",
                        "next_followup_date": "2026-10-15",
                        "remarks": "Annual Metal Detector Fleet Modernisation Opportunity"
                    },
                    description="Registers an active lead using exact DTO fields.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleLeadId', res.id); }"
                    ]
                ),
                req(
                    "Get Lead by ID",
                    "GET",
                    "/leads/{{sampleLeadId}}",
                    description="Fetches lead details.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Update Lead Status & Value (Funnel Progression)",
                    "PATCH",
                    "/leads/{{sampleLeadId}}",
                    body={
                        "status": "proposal_submitted",
                        "value_lakh": 52.0,
                        "probability": "high"
                    },
                    description="Transitions lead in sales funnel.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "13. Master Records & Metadata",
            "item": [
                req(
                    "Get Zones",
                    "GET",
                    "/masters/zones",
                    description="Lists operational zones (North, East, North East, South, West).",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Get Regions",
                    "GET",
                    "/masters/regions",
                    description="Lists states/regions mapped under zones.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Get Products Catalog",
                    "GET",
                    "/masters/products",
                    description="Lists security and surveillance equipment catalog.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create Product (Admin)",
                    "POST",
                    "/masters/products",
                    body={
                        "name": "Underwater Metal Detector (UWMD-600) - " + str(uuid.uuid4())[:4],
                        "category": "Demining & Diving",
                        "make": "CEIA SpA",
                        "is_mha_qr": True,
                        "spec_ref": "MHA/QR/WTMD/2026-REV3"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{adminToken}}", "type": "string"}]
                    },
                    description="Adds product using exact SQL columns (make, is_mha_qr, spec_ref).",
                    test_script=[
                        "pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleProductId', res.id); }"
                    ]
                )
            ]
        },
        {
            "name": "14. Users & Access Management",
            "item": [
                req(
                    "List All Users Across Hierarchy",
                    "GET",
                    "/users",
                    query_params=[
                        {"key": "role", "value": "sales", "disabled": True},
                        {"key": "is_active", "value": "true", "disabled": True}
                    ],
                    description="Lists users with roles and manager reporting chain.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Create User (Admin Only)",
                    "POST",
                    "/users",
                    body={
                        "full_name": "Rohan Gupta",
                        "email": "rohan.sales." + str(uuid.uuid4())[:6] + "@arihant.com",
                        "phone": "+919811009988",
                        "role": "sales",
                        "password": "password123"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{adminToken}}", "type": "string"}]
                    },
                    description="Provisions a new user account.",
                    test_script=[
                        "pm.test('Status is 201 Created', () => pm.response.to.have.status(201));",
                        "var res = pm.response.json();",
                        "if (res && res.id) { pm.collectionVariables.set('sampleUserId', res.id); }"
                    ]
                ),
                req(
                    "Deactivate User (Admin Action - Employee Teardown)",
                    "PATCH",
                    "/users/{{sampleUserId}}",
                    body={
                        "is_active": False
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{adminToken}}", "type": "string"}]
                    },
                    description="Deactivates user account to revoke access.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "15. Uploads & Attachments",
            "item": [
                req(
                    "Generate Upload Signature",
                    "POST",
                    "/uploads/sign",
                    body={"folder": "receipts"},
                    description="Generates signed parameters for secure direct file uploads.",
                    test_script=["pm.test('Status is 200/201 OK', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));"]
                ),
                req(
                    "Attach File to Entity (Tender / Expense / Report)",
                    "POST",
                    "/uploads/attach",
                    body={
                        "entity_type": "tender",
                        "entity_id": "{{sampleTenderId}}",
                        "file_name": "Tender_Specification_MHA.pdf",
                        "file_url": "https://arihant-storage.com/files/tender_mha_spec.pdf",
                        "file_size": 2048576,
                        "mime_type": "application/pdf"
                    },
                    description="Links an uploaded document to any BOS entity.",
                    test_script=["pm.test('Status is 201 Created', () => pm.response.to.have.status(201));"]
                ),
                req(
                    "Get Attachments for Entity",
                    "GET",
                    "/uploads/attachments",
                    query_params=[
                        {"key": "entity_type", "value": "tender"},
                        {"key": "entity_id", "value": "{{sampleTenderId}}"}
                    ],
                    description="Retrieves attached documents.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "16. Notifications & Audit Trail",
            "item": [
                req(
                    "Get My Notifications Inbox",
                    "GET",
                    "/notifications",
                    description="Returns real-time notifications for the logged-in user.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Get Unread Notification Count",
                    "GET",
                    "/notifications/unread-count",
                    description="Returns total number of unread alerts.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Mark All Notifications as Read",
                    "PATCH",
                    "/notifications/read-all",
                    description="Marks all notifications as read.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                ),
                req(
                    "Get Audit Trail (Admin / Management)",
                    "GET",
                    "/audit",
                    query_params=[
                        {"key": "entity_type", "value": "tender", "disabled": True},
                        {"key": "action", "value": "status_changed", "disabled": True}
                    ],
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{mgmtToken}}", "type": "string"}]
                    },
                    description="System-wide audit trail recording who changed what and when.",
                    test_script=["pm.test('Status is 200 OK', () => pm.response.to.have.status(200));"]
                )
            ]
        },
        {
            "name": "17. Edge Cases, RBAC Denials & Validations",
            "item": [
                req(
                    "Negative Auth: Wrong Password -> 401 Unauthorized",
                    "POST",
                    "/auth/login",
                    body={"email": "mgmt@arihant.com", "password": "WrongPassword123!"},
                    description="Validates that incorrect credentials return 401.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 401 Unauthorized', () => pm.response.to.have.status(401));"
                    ]
                ),
                req(
                    "Negative Auth: Missing Bearer Token -> 401 Unauthorized",
                    "GET",
                    "/dashboard/metrics",
                    description="Validates that protected endpoints reject requests without a JWT token.",
                    is_public=True,
                    test_script=[
                        "pm.test('Status is 401 Unauthorized', () => pm.response.to.have.status(401));"
                    ]
                ),
                req(
                    "RBAC Negative: Sales Rep Tries to Approve Tender -> 403 Forbidden",
                    "POST",
                    "/tenders/{{sampleTenderId}}/approve",
                    body={"decision": "approved", "remarks": "Unauthorized sales approval attempt"},
                    description="Ensures Sales role is denied tender approval privileges.",
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{salesToken}}", "type": "string"}]
                    },
                    test_script=[
                        "pm.test('Status is 403 Forbidden', () => pm.response.to.have.status(403));"
                    ]
                ),
                req(
                    "RBAC Negative: Sales Rep Tries to Access Audit Trail -> 403 Forbidden",
                    "GET",
                    "/audit",
                    description="Ensures Sales role cannot inspect compliance audit logs.",
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{salesToken}}", "type": "string"}]
                    },
                    test_script=[
                        "pm.test('Status is 403 Forbidden', () => pm.response.to.have.status(403));"
                    ]
                ),
                req(
                    "RBAC Negative: Service Tech Tries to Approve Expenses -> 403 Forbidden",
                    "PATCH",
                    "/expenses/{{sampleExpenseId}}/manager-approve",
                    body={"decision": "manager_approved"},
                    description="Ensures Service role cannot approve expense disbursements.",
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{serviceToken}}", "type": "string"}]
                    },
                    test_script=[
                        "pm.test('Status is 403 Forbidden', () => pm.response.to.have.status(403));"
                    ]
                ),
                req(
                    "RBAC Negative: Sales Rep Tries to Provision User -> 403 Forbidden",
                    "POST",
                    "/users",
                    body={
                        "full_name": "Hacker User",
                        "email": "hacker@arihant.com",
                        "role": "admin",
                        "password": "password123"
                    },
                    description="Ensures non-admin roles cannot create users.",
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{salesToken}}", "type": "string"}]
                    },
                    test_script=[
                        "pm.test('Status is 403 Forbidden', () => pm.response.to.have.status(403));"
                    ]
                ),
                req(
                    "Validation Negative: Negative Expense Amount -> 400 Bad Request",
                    "POST",
                    "/expenses",
                    body={
                        "expense_date": "2026-09-16",
                        "category": "travel",
                        "amount": -500,
                        "purpose": "Invalid negative claim"
                    },
                    description="Validates class-validator rejects negative amounts with 400.",
                    test_script=[
                        "pm.test('Status is 400 Bad Request', () => pm.response.to.have.status(400));"
                    ]
                ),
                req(
                    "Validation Negative: Missing Required Tender Number -> 400 Bad Request",
                    "POST",
                    "/tenders",
                    body={
                        "department": "BSF",
                        "remarks": "Missing tender_no"
                    },
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{adminToken}}", "type": "string"}]
                    },
                    description="Validates that omitting required fields returns 400.",
                    test_script=[
                        "pm.test('Status is 400 Bad Request', () => pm.response.to.have.status(400));"
                    ]
                ),
                req(
                    "Validation Negative: Invalid Blocker Enum Type -> 400 Bad Request",
                    "POST",
                    "/tasks/{{sampleTaskId}}/blockers",
                    body={
                        "blocker_type": "invalid_blocker_type_xyz",
                        "description": "Testing invalid enum validation"
                    },
                    description="Validates enum validation rejects unknown types with 400.",
                    test_script=[
                        "pm.test('Status is 400 Bad Request', () => pm.response.to.have.status(400));"
                    ]
                ),
                req(
                    "Entity Lookup: Non-Existent UUID -> 404 Not Found",
                    "GET",
                    "/tenders/00000000-0000-0000-0000-000000000000",
                    auth_override={
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{adminToken}}", "type": "string"}]
                    },
                    description="Validates lookup of a non-existent UUID returns 404.",
                    test_script=[
                        "pm.test('Status is 404 Not Found', () => pm.response.to.have.status(404));"
                    ]
                )
            ]
        }
    ]
}

with open("/home/dheerajsingh/Desktop/arihant-bos/arihant_bos_postman_collection.json", "w") as f:
    json.dump(collection, f, indent=2)

print("✅ Successfully generated Postman Collection with Edge Cases & Variable Chaining: arihant_bos_postman_collection.json")
