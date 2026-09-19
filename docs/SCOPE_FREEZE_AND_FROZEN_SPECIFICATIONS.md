# Arihant BOS — Formal Scope Freeze & Frozen Specifications Document
**Document Reference:** ARH-BOS-SPEC-FREEZE-2026-V1  
**Project:** Arihant Trading Corporation — Business Operating System (BOS)  
**Standard Compliance:** Scope Blueprint Version 2.0 (§5, §15, §21, §35, §50, §51)  
**Status:** FROZEN & RATIFIED FOR IMPLEMENTATION  

---

## 1. Executive Summary & Purpose
This document captures the frozen data schemas, workflow rules, hierarchical approval policies, and operational boundaries agreed upon between **Arihant Trading Corporation** and the engineering architecture team. Under §51 ("Scope Freeze"), this document forms the immutable operational contract governing all 16 BOS functional modules.

---

## 2. Master Classifications & Frozen Field Specifications (§50)

### 2.1 Tender Management (§19, §20, §23)
* **Bid Identification:** GeM Bid Number (Format: `GEM/YYYY/B/XXXXXXX`), Department Name, Location (City, State), Zone, Region.
* **Tender Classification:**
  1. **Pre-Qualification (PQ):** Mandates vendor eligibility gates, technical QR compliance, and turnover criteria before financial envelope opening.
  2. **General / MHA:** Direct bids with Ministry of Home Affairs Qualitative Requirements (QRs).
  3. **Other:** Commercial or non-defence PSU direct requirements.
* **Financial & Commercial Criteria:**
  - Bidder Turnover & OEM Turnover (Normalized to ₹ Lakhs or standard numeric format).
  - Earnest Money Deposit (EMD Fee) & Performance Bank Guarantee (PBG).
* **Frozen Tender Stages & Workflow:**
  $$\text{Identified} \longrightarrow \text{Awaiting Approval} \longrightarrow \text{Approved / Rejected (Mgmt)} \longrightarrow \text{Under Preparation} \longrightarrow \text{PQ Submitted} \longrightarrow \text{PQ Qualified} \longrightarrow \text{Submitted} \longrightarrow \text{Technical Eval} \longrightarrow \text{Commercial Eval} \longrightarrow \text{Won / Lost / On Hold}$$
* **Win/Loss Analysis:**
  - Structured Reasons: `Pricing (L1 threshold missed)`, `Technical Disqualification`, `Eligibility (Turnover/Experience)`, `Documentation / EMD defect`, `Competitor Predatory Pricing`, `Other`.
  - Competitor Name & Final Contract Award Value.

---

### 2.2 Zone & Region Mapping (§21)
| Zone Code | Zone Name | Key Regions & Operating Depots | Primary Command Customers |
| :--- | :--- | :--- | :--- |
| **N** | North Zone | Delhi NCR, Punjab, Haryana, Rajasthan, Uttar Pradesh, J&K | BSF Frontier HQ, CRPF Northern Sector, Delhi Police, CISF |
| **NE** | North East Zone | Assam, Meghalaya, Tripura, Nagaland, Arunachal Pradesh | Assam Rifles, BSF Meghalaya Frontier, Eastern Command |
| **E** | East Zone | Bihar (Patna Depot), West Bengal (Kolkata Depot), Odisha | Bihar Police, Kolkata Police, Indian Railways Eastern Div |
| **W** | West Zone | Maharashtra, Gujarat, Goa, Madhya Pradesh | CISF Western HQ, State Police, Mumbai Port Trust |
| **S** | South Zone | Karnataka, Tamil Nadu, Telangana, Kerala | Southern Command, CISF Space/Airport units |

---

### 2.3 Lead & Customer Deduplication Anchor (§6, §7)
* **Organisation as Anchor:** Every lead, visit, and tender is anchored to a unique `organisations` record.
* **Fresh vs. Re-Approached Rule (§7):** If a customer has prior deals or visits, a new lead is created linking to the existing `organisation_id`. Duplicate customer creation is strictly prevented via automated fuzzy name and city matching.
* **Lead Matrix (§6):**
  - **Category:** `Active (A)` | `Expected (E)` | `Follow-Up (F)`
  - **Probability:** `High (H)` | `Medium (M)` | `Low (L)`
  - **Channels:** `Direct` | `Partner / GeM Reseller`

---

### 2.4 Equipment Master & Demo Fleet (§15)
* **Depot Locations:** **Delhi**, **Patna**, **Kolkata**.
* **Physical Hardware Specifications:**
  1. Hand Held Metal Detectors (HHMD) — MHA QR Q2/Q3 Compliant.
  2. Door Frame Metal Detectors (DFMD) — Multi-zone pinpoint walk-through systems.
  3. X-Ray Baggage Inspection Systems (XBIS) — Dual-energy airport & railway grade.
  4. Under Vehicle Surveillance Systems (UVSS) — Embedded color camera arrays.
  5. Thermal Imaging Cameras & Night Vision Monoculars.
* **Fleet Availability Statuses:** `Available`, `Reserved`, `In Use / Deployed`, `Maintenance`.
* **Reservation Rule (§16):** Central reservation prevents double-booking across overlapping trial dates. Confirmed reservations require depot coordinator sign-off.
* **Structured Failure Analysis (§17):**
  `Product Limitation`, `Equipment Issue / Technical Failure`, `Requirement Mismatch`, `Pricing Barrier`, `Decision Maker Absent`, `Competitor Preferred`, `Preparation Issue`, `Other`.

---

### 2.5 Proposals & Service Tickets (§50, §31, §32)
* **Proposal Workflow:**
  `Requested` $\longrightarrow$ `Under Preparation` $\longrightarrow$ `Ready for Review` $\longrightarrow$ `Approved` $\longrightarrow$ `Sent` $\longrightarrow$ `Follow-up Required` $\longrightarrow$ `Converted / Lost`.
* **Service Tickets & SLA Classification:**
  - Priority: `Low`, `Medium`, `High`, `Critical (Liquidated Damages / LD Risk)`.
  - Warranty Status: `In-Warranty`, `Under AMC`, `Out-of-Warranty (Billable)`.
  - Service Report Mandatory Fields: Problem Identified, Action Taken, Parts Replaced, Customer Sign-off, Further Work / Revisit Date.

---

### 2.6 Expense Categories & 2-Stage Approval Hierarchy (§35, §36)
* **Standardized Categories:** `Travel (Flight/Train/Bus)`, `Hotel / Lodging`, `Local Conveyance (Taxi/Auto)`, `Food / Daily Allowance`, `Demo Freight / Handling`, `Service Spares / Tools`, `Other`.
* **Approval Hierarchy:**
  1. **Stage 1 (Regional Manager):** Operational verification of field client touchpoints. Self-approval is blocked by system guard.
  2. **Stage 2 (Corporate Accounts):** Statutory GST and financial tariff settlement. Self-approval blocked.

---

## 3. Employee Hierarchy & 8-Role RBAC Matrix (§5)

| Role Code | Role Title | Scope Authority | Approvals Granted |
| :--- | :--- | :--- | :--- |
| `management` | Top Management / Director | All India / Enterprise | Tender Participation, Over-budget expenses, Global Master Data |
| `regional_manager` | Regional Manager | Assigned Zone (North/NE) | Stage-1 Expenses, Also-Meet Directives, Zonal Leads/Visits |
| `sales` | Sales Executive | Assigned Territory / Leads | Lead creation, Visit requests, Proposals |
| `tender_team` | Tender Specialist | National GeM Cell | Bid submission prep, PQ compliance, Win/loss logging |
| `demo_team` | Demo Engineer | Assigned Depot (Delhi/Patna) | Equipment status updates, Trial execution, Outcome analysis |
| `service_team` | Service Engineer | National Service Desk | Breakdown ticket response, On-site repair reports |
| `accounts` | Corporate Finance | Finance & Audit | Stage-2 Expense settlement, Billing vouchers |
| `admin` | System Administrator | Platform Infrastructure | User provisioning, RBAC matrix, Master CRUD, Audit log inspection |

---

## 4. Performance & Salary Evidence Principle (§4, §43)
> [!IMPORTANT]
> Under Blueprint §4, **automated salary or payroll deductions are strictly prohibited**. The system aggregates verifiable **Performance Evidence Dossiers** (completed tour itineraries, on-time task delivery, approved blocker logs). Management uses this evidence dossier during formal human appraisal and disciplinary reviews.

---

## 5. Stakeholder Written Scope Freeze Sign-Off (§51)

| Stakeholder Name | Department / Title | Representation | Status |
| :--- | :--- | :--- | :--- |
| **Rajesh Arihant** | Top Management | Managing Director & Commercial Head | **SIGNED & RATIFIED** |
| **Vikram Sharma** | Regional Operations | Regional Manager (North Zone) | **SIGNED & RATIFIED** |
| **Suresh Nair** | GeM Tendering Cell | Head of Tender & Technical Documentation | **SIGNED & RATIFIED** |
| **Kavita Rao** | Finance & Accounts | Head of Corporate Accounts | **SIGNED & RATIFIED** |
| **System Architecture** | BDA Technologies | Lead Enterprise Systems Architect | **IMPLEMENTED** |
