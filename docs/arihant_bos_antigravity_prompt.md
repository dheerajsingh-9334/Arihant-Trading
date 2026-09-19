# BUILD PROMPT — Arihant Trading Corporation "Business Operating System" (BOS)

> Paste this whole file into Antigravity as the task.
> **Attach these files to the session first (source of truth — read them before coding):**
> `arihant_bos_schema.sql`, `arihant_bos_build_blueprint.html`, `Contact_List.xlsx`,
> `North_Live_Tender_Sheet_FY_2026-27.xlsx`, `Sample_Sales_Funnel_Sheet_2026-27.xlsx`,
> `Arihant_Trading_Corporation_BOS_Scope_Blueprint.pdf`.

---

## 0. Role & mission

You are a **senior full-stack engineer**. Build a **complete, production-grade, fully working** Business Operating System (BOS) for Arihant Trading Corporation — a firm that sells security & defence equipment (metal detectors, X-ray baggage scanners, thermal imagers, night vision, bollards, boom barriers) to government buyers (BSF, Army, Railways, Nuclear Power Corp, Police) mostly via **GeM tenders**. They currently run on WhatsApp + Excel. The BOS gives every lead, tender, demo, proposal, service ticket, visit and expense an owner, a status, a next action and a history.

**Read every attached file end to end before writing code.** `arihant_bos_schema.sql` is the authoritative database schema. `arihant_bos_build_blueprint.html` holds the architecture, the 8 roles, the full permission matrix, the module list and the build order. The `.xlsx` files and the PDF hold the real data and functional scope — mine them for seed data and field definitions.

**The deliverable is the COMPLETE website — all modules, all working.** Not a Phase-1 subset, not a demo, no dummy placeholder screens, no "coming soon". Every page runs, is seeded with real data, and is verified by you before you report done.

---

## 1. Tech stack (locked — do not substitute)

- **Backend:** NestJS (TypeScript), modular.
- **Frontend:** Next.js (App Router) + TypeScript.
- **Database:** Supabase (PostgreSQL). **No Prisma.** Use **Kysely**; generate types with `kysely-codegen` from the live schema.
- **Auth:** Supabase Auth issues JWTs; NestJS verifies via a guard using the Supabase JWT secret, loads role from `users`, enforces RBAC.
- **Realtime:** **WebSockets** via an authenticated NestJS Socket.IO gateway.
- **Events:** **event-driven** in-process bus using `@nestjs/event-emitter` (no Kafka — 300 users don't need it).
- **Jobs/schedules:** `@nestjs/schedule` (cron) for deadline reminders + recurring-task generation.
- **Uploads:** **Cloudinary, chunked** (see §6).
- **UI:** Tailwind + **shadcn/ui**; animation with **Framer Motion** (`motion`).
- **Package manager:** pnpm. **Monorepo** with the exact structure in §3.

---

## 2. Use Antigravity's own capabilities (work this way)

- **Planning mode first.** Read the attached files, then produce `implementation_plan.md` (architecture, module list, data model reconciliation with the schema, edge-case handling from §9, verification plan) and a `task.md` checklist. Keep `task.md` updated as you go.
- **Execution mode.** Implement against the plan. Use `run_command` for installs, typecheck, lint, build, migrations, seed, and tests. Use `codebase_search` / `grep_search` to keep patterns consistent across the ~15 modules — never diverge module-to-module.
- **Verification mode + `browser_subagent`.** After each major slice, open the running app in the browser, **log in as each of the 8 roles**, click through the real flows, and capture screenshots/recordings into `walkthrough.md` as proof. Add your local URLs (`http://localhost:3000`, API port) to the browser allowlist so the agent can control them.
- **Reusable workflow.** Create `.agent/workflows/build-module.md` capturing the per-module recipe from §7 and follow it for every module so quality is uniform.
- **Knowledge items.** Save durable facts (schema decisions, seed logins, env vars, conventions) as knowledge so they persist across runs.
- **Parallel subagents** where safe (e.g. one agent per independent module) — but keep shared code (`common/`, `packages/shared`) single-owned to avoid conflicts.
- **Confidence + honesty.** Rate your confidence before declaring done; if blocked or ambiguous, return to Planning, make a sensible production default, and record the assumption in `walkthrough.md` — don't stall and don't fake completion.
- **Terminal policy** may prompt on destructive commands — that's expected; proceed with safe routine commands.

---

## 3. Monorepo folder structure (put every file in its proper place)

**Rule: every file has a home in this tree. Do not scatter files at the root or invent parallel structures.** If you add something, place it in the matching folder and note it in `implementation_plan.md`.

```
arihant-bos/
├─ .agent/workflows/build-module.md         # reusable per-module recipe
├─ apps/
│  ├─ api/                                    # NestJS backend
│  │  ├─ src/
│  │  │  ├─ main.ts  app.module.ts
│  │  │  ├─ common/
│  │  │  │  ├─ auth/          # jwt.guard.ts, roles.guard.ts, roles.decorator.ts, current-user.decorator.ts
│  │  │  │  ├─ database/      # kysely client + generated types
│  │  │  │  ├─ events/        # event bus, event names, audit listener
│  │  │  │  ├─ realtime/      # socket.io gateway + ws-auth
│  │  │  │  ├─ cloudinary/    # signed-upload signature service
│  │  │  │  ├─ filters/       # global exception filter
│  │  │  │  ├─ interceptors/  # logging, response transform
│  │  │  │  ├─ pipes/         # validation
│  │  │  │  └─ utils/         # pagination, indian-number/date format, guards
│  │  │  ├─ modules/          # one folder each: controller + service + dto/
│  │  │  │  ├─ users/  organisations/  contacts/  leads/  interactions/
│  │  │  │  ├─ visits/  demos/  tenders/  proposals/  service/
│  │  │  │  ├─ expenses/  tasks/  notifications/  dashboard/  uploads/
│  │  │  └─ jobs/             # cron: deadline-reminders, recurring-tasks
│  │  ├─ test/                # e2e (supertest)
│  │  ├─ .env.example  package.json
│  └─ web/                                    # Next.js frontend
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (auth)/login/
│     │  │  ├─ (app)/
│     │  │  │  ├─ layout.tsx   # shell: sidebar + topbar + role-based nav
│     │  │  │  ├─ dashboard/
│     │  │  │  ├─ leads/       # page.tsx  [id]/page.tsx  new/page.tsx
│     │  │  │  ├─ tenders/  visits/  demos/  proposals/
│     │  │  │  ├─ service/  expenses/  tasks/  notifications/
│     │  │  │  └─ admin/       # users, masters, audit log
│     │  ├─ components/
│     │  │  ├─ ui/             # shadcn components
│     │  │  ├─ layout/         # sidebar, topbar, command-palette (Cmd+K)
│     │  │  ├─ tables/         # reusable data-table
│     │  │  └─ forms/
│     │  ├─ lib/               # api client, supabase client, auth, ws client, formatters
│     │  ├─ hooks/  styles/
│     ├─ .env.example  package.json
├─ packages/shared/                           # shared TS types, DTO contracts, enums, zod schemas, kysely types
├─ db/
│  ├─ schema.sql                              # the provided schema
│  ├─ migrations/
│  └─ seed/                                   # seed scripts + xlsx importers
├─ docker-compose.yml
├─ pnpm-workspace.yaml   turbo.json (optional)
├─ package.json
└─ README.md
```

---

## 4. Architecture requirements

1. **Modular NestJS** — one module per domain (controller + service + validated DTOs). Cross-cutting code (JWT guard, `@Roles()`, Kysely client, audit helper, event bus, WS gateway, Cloudinary) lives in `common/`.
2. **Event-driven.** Domain actions emit typed events; listeners react. At minimum: `tender.status_changed`, `tender.deadline_soon`, `expense.submitted`, `expense.approved`, `task.assigned`, `task.blocked`, `lead.followup_due`, `proposal.followup_due`. A shared audit listener writes `audit_log` on every create/update/delete/status-change; a notification listener writes `notifications` + pushes over WebSocket + appends `tender_status_history` where relevant.
3. **WebSockets.** Authenticated Socket.IO gateway; rooms per `userId`, `role`, `region`. Live: new-notification badge + toast, dashboard metric updates, tender status changes — no page refresh.
4. **RBAC + region scoping** enforced in guards (NestJS uses the `service_role` key and bypasses RLS). Implement the **exact permission matrix and approval chains** from the blueprint: Management = all regions; Regional Manager = own region; Sales/Demo/Service = own or assigned; tender participation approved by Management; expenses approved manager→accounts (two stages); demo-equipment reservations approved by the equipment owner.
5. **Performance.** Every list endpoint paginated + filterable (never unbounded). No N+1 — join/batch in Kysely. Use the Supabase connection pooler. Cache reference data (products/zones/regions) with short TTL. gzip, DTO validation, query timeouts. Frontend: server components where possible, request caching, optimistic status updates, skeleton loaders, lazy routes.

---

## 5. Database

- Apply `arihant_bos_schema.sql` exactly (all 10 modules' tables, enums, triggers, indexes). Extend only via migrations in `db/migrations/`; never silently diverge.
- Generate Kysely types into `packages/shared`.
- **Seed (mandatory) — every screen populated with realistic data, runnable via `pnpm seed`, idempotent:**
  - Import real rows: `Contact_List.xlsx` → `organisations` + `contacts`; all 30 tender rows → `tenders` (map zones N/NE, bid-closing dates, EMD, product/requirement); `Sample_Sales_Funnel` (Funnel + Bill&Book) → `leads`.
  - Generate the rest so the whole system feels live: ~30 **users** across all 8 roles + both zones with a real `reporting_manager_id` hierarchy; masters; demo equipment in Patna/Delhi/Kolkata; demos + outcomes; proposals at each stage; service tickets + reports; expenses at each approval stage; tasks (incl. overdue + blocked); notifications.
  - **One login per role**, documented in the README, so a reviewer can log in as each and see correct data + permissions.

---

## 6. File uploads — Cloudinary, chunked

- NestJS generates a **signed upload** (signature + timestamp + folder); the API secret never reaches the client.
- Frontend uploads **directly to Cloudinary in chunks** with a real per-chunk progress bar and **resume/retry on a failed chunk** (not restart).
- On success store `secure_url` + `public_id` + filename in `attachments` (`entity_type`, `entity_id`) — receipts, service reports, tender docs, equipment photos.
- Validate MIME + size before upload; verify ownership before attaching; clean up orphaned assets when the parent is deleted.

---

## 7. Modules — build the complete website

Build **vertically** (one feature top-to-bottom, verified, then the next) — not all modules a little each. Recommended order so the hardest foundation is proven first, but **deliver all of them working**:

1. Auth + Users + Roles (RBAC, region scoping, bulk user seed, role login)
2. Leads & Customers + Interaction timeline (organisations = dedupe anchor; one row per org+product)
3. Tenders (pipeline board + list with red badge for bids closing ≤7 days; detail; create/edit; guarded status transitions; approval; win/loss; PQ vs General/MHA counts; status history + audit)
4. Visits (weekly plan, assign, post-visit update, manager "also-meet" intervention)
5. Management dashboard (role-based exception view, live via WebSocket)
6. Demos + equipment availability + reservations + outcome/failure analysis
7. Proposals + follow-up tracking
8. Service tickets + service reports
9. Expenses + two-stage approval
10. Tasks + blockers + productivity
11. Notifications centre + audit-log viewer (admin) + masters/user admin

**Per-module recipe (identical every time — put it in `.agent/workflows/build-module.md`):** API first (controller → service → validated DTO, guarded, paginated, event-emitting) → list view (data table + filters + status pills + empty state) → detail + create/edit form → guarded status control → wire events/notifications → browser-verify.

**If one run exhausts context, continue in the next run and finish the remaining modules — never stop at a subset and never leave broken, un-runnable code.** Keep `task.md` accurate so the next run resumes cleanly.

---

## 8. Frontend & design (make it look like a premium ₹10L product)

- **Shell:** persistent sidebar + topbar, **role-based nav** (a salesperson never sees Admin). Disciplined layout, generous whitespace, one accent colour, one type ramp, one spacing scale.
- **Dense tables done well** (fast, sortable, filterable, inline status badges), **command palette (Cmd+K)** to jump to any record, empty states that invite action.
- **Animations (tasteful, Framer Motion):** route transitions, staggered list reveals, dialog/sheet open-close, dashboard number count-ups, skeleton loaders, live-notification toast. **Respect `prefers-reduced-motion`.** Motion confirms actions — don't animate everything.
- **Mobile-first for field staff** (sales/demo/service): big tap targets, dropdowns over typing, one-click status updates.
- Real, human copy (sentence case, active voice, plain terms) — no lorem ipsum.

**Frontend references — study these:**
- Product patterns: **Linear** (linear.app — dense tables, keyboard flow), **Attio** (attio.com — CRM as an operating surface), **Stripe** (stripe.com/dashboard — layered disclosure), **HubSpot** (hubspot.com — pipeline/deal stages), **Salesforce Lightning** (enterprise CRM patterns).
- Screen galleries: **Mobbin** (mobbin.com), **SaaSFrame** (saasframe.io), **SaaSUI** (saasui.design), **Dribbble** (dribbble.com), **Godly** (godly.website).
- Components/animation: **shadcn/ui** (ui.shadcn.com), **Tremor** (tremor.so — dashboard charts), **Aceternity UI** (ui.aceternity.com) & **Magic UI** (magicui.design) for polished motion, **Framer Motion** (motion.dev).

---

## 9. Edge cases — handle ALL of these (add tests for the critical ones)

**Auth & session**
- Expired / invalid / malformed JWT → 401 + redirect to login; silent Supabase session refresh.
- Deactivated user (`is_active=false`) with a still-valid token → blocked everywhere.
- Role changed mid-session → permissions re-checked server-side each request (never trust the client's cached role).
- Multiple tabs / concurrent logins → WebSocket reconnects, notifications don't double-count, mark-read syncs across tabs.
- User with no region assigned → sees nothing region-scoped until an admin assigns one (clear message, no crash).

**Authorization (server-side, not just hidden in UI)**
- Direct API access to another region's / owner's record (IDOR) → 403.
- Self-approval (manager approving their own expense/tender) → blocked.
- Regional manager acting outside their region → blocked.
- Unknown/missing role → deny by default. Ignore any `role`/`ownerId` fields sent in request bodies (no privilege escalation via payload).

**Data integrity & dedupe**
- Duplicate organisation (same name, different casing/whitespace) on create/import → fuzzy-match + warn/merge, never silent duplicate (this is the "fresh vs re-approached" requirement).
- Duplicate tender number → prevent/warn.
- Deleting an org/product that has children → soft-delete or block via FK; cascade only where safe.
- Lead without product, contact without org, empty required fields → validation errors.
- Messy Excel import: blank rows, `"NA"` strings, `"46 Lakh"` text amounts, dates stored as text vs datetime, merged header cells → normalize/clean on import; log skipped rows.

**Dates, timezones, deadlines**
- Store UTC (`timestamptz`), display **Asia/Kolkata (IST)** everywhere.
- Bid-closing values that are text in the sheet → parse robustly; unparseable → flag, don't crash.
- "Closing within 7 days" boundary conditions (exactly 7 days, already closed, no date set).
- Corrigendum extends a deadline → update, re-evaluate reminders, keep history.
- Recurring tasks crossing month/year boundaries; past-dated visits/expenses allowed but flagged.

**Money & numbers**
- Amounts in Lakh/text → normalize to numeric; display **Indian format** (₹, 1,00,000 grouping, lakh/crore).
- Use `numeric`/decimal, never float. Reject negative/zero/absurd values. `"NA"` fee → null, not 0.

**Workflow & status transitions**
- Illegal transitions (Lost→Won, skipping approval) → rejected; only defined transitions allowed.
- **Concurrency:** two users change the same tender/expense at once → optimistic locking via `updated_at`/version; show a clear conflict message instead of silent overwrite.
- Double-approval / approving an already-decided item → idempotent, blocked.
- Cancel/reschedule a visit → require a reason, notify manager, keep audit (blueprint §11).
- Reopen a closed ticket / resubmit a rejected expense / re-raise a rejected blocker → allowed with a new history entry.

**Uploads (Cloudinary chunked)**
- Slow/large file → chunked with resume; failed chunk retries, not restarts.
- Interrupted upload / user navigates away → clean partial, allow resume.
- Wrong type / oversized / spoofed extension → rejected before upload.
- Expired signature → regenerate. Orphaned assets on parent delete → cleanup job.

**Realtime / WebSockets**
- Connection drop → auto-reconnect with backoff; on reconnect, resync missed notifications (persist in DB, deliver on next connect).
- Unauthenticated socket → rejected.
- Bulk import / event storm → batch and throttle notifications so users aren't flooded.

**Lists, search, queries**
- Large result sets → pagination enforced; deep pagination uses cursors on hot paths.
- Search with special chars → parameterized Kysely queries (no injection).
- Empty results / no data yet → proper empty states, never an infinite spinner.
- Sorting/filtering on null fields → nulls handled (nulls last).

**Forms & input**
- Required/optional, max lengths, email + **Indian phone** (+91, 10 digits) validation.
- XSS in free-text (remarks/comments) → escaped on render.
- Double-click submit → debounce / idempotency key. Unsaved-changes navigation → warn. Unicode/emoji/very long text → handled and truncated with tooltip in tables.

**Cron / reminders**
- Overlapping cron runs / restart mid-run → lock so jobs don't double-fire.
- Reminder for an item completed/cancelled before the run → skipped. Duplicate notifications → deduped. "Due today" respects IST.

**System robustness**
- Supabase/DB timeout or down → graceful user-friendly error + retry, never a raw stack trace to the user.
- Multi-step operations → wrapped in transactions with rollback on partial failure.
- Rate limiting / abuse throttling on write endpoints.
- Every screen has loading, error, and empty states.
- Accessibility: keyboard nav, visible focus, contrast, reduced motion.
- Deep links / refresh / browser back-forward on any route → state restored (SSR).
- Missing env var → fail fast with a clear message. Secrets never shipped in the client bundle. Seed re-run stays idempotent.

---

## 10. Self-verification (before reporting done — non-negotiable)

Run and make **all** pass; fix red and re-run:
1. `pnpm typecheck` — zero errors (api + web + shared).
2. `pnpm lint` — clean.
3. `pnpm build` — both apps build.
4. Apply schema + `pnpm seed` — print a row-count summary; confirm expected counts.
5. Backend e2e (supertest): login; a guarded endpoint denies the wrong role; tender list is paginated + filtered; a tender status change writes `tender_status_history` + `audit_log` + emits an event; expense submit notifies the approver; **self-approval is blocked**; **IDOR across regions is blocked**.
6. Frontend browser verification via `browser_subagent`: log in as each of the 8 roles → correct nav; tenders list loads seeded data + red badge on a bid closing ≤7 days; open a tender, change status; upload a file to Cloudinary and see it attached; a WebSocket notification appears live. Capture screenshots/recordings into `walkthrough.md`.
7. Click through every module's core flow yourself; confirm data is real (seeded), permissions hold, realtime + uploads work.

Produce a **QA checklist in the README** with every item ticked, plus per-role logins, env-var list, and exact run steps.

---

## 11. Deliverables (definition of done)

- Monorepo matching §3 that runs locally with documented steps (prefer `docker compose up` + `pnpm seed`).
- `.env.example` for both apps (Supabase URL/keys/JWT secret, Cloudinary creds) — **no real secrets committed**.
- Applied schema, idempotent seed, generated Kysely types.
- **All modules functional end-to-end**, with WebSocket realtime, event-driven notifications + audit, Cloudinary chunked uploads, RBAC + region scoping, paginated fast queries — demonstrated by the tests and the `walkthrough.md` browser recordings.
- `README.md`: architecture overview, setup, run, seed, per-role logins, QA checklist, and the edge-cases-covered list.
- Antigravity artifacts present: `implementation_plan.md`, `task.md`, `walkthrough.md`.

---

## 12. Guardrails — do NOT

- No Prisma or any ORM other than Kysely.
- No application data in `localStorage`/`sessionStorage`; state lives in the DB (via the API) + React state.
- No dummy/placeholder UI or unseeded screens.
- No hardcoded secrets; use env vars.
- No broken, un-runnable code or silent TODOs in critical paths.
- Do not skip §10 verification; if something can't pass, say so explicitly in the README with the reason.
- Do not stop at a subset of modules — the deliverable is the whole website.
- Where a detail is genuinely ambiguous, choose a sensible production default and **document the assumption** — don't stall.

Build it. Verify it yourself with the browser. Then report what's complete, how it was verified, and how to run it.
