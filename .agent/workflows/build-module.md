# Reusable Per-Module Recipe — Arihant BOS

To maintain uniform architecture, reliability, and code quality across all ~15 modules of the Arihant Business Operating System, every module must strictly follow this 5-step recipe:

---

## 1. Backend API First

1. **DTOs (`<module>.dto.ts`)**:
   - Define validated request bodies using `class-validator` and TypeScript types.
   - Include pagination and filter query DTOs extending `PaginationQueryDto`.
   - Never trust client-sent `userId`, `role`, or `regionId` from body — always extract from `@CurrentUser()`.

2. **Service (`<module>.service.ts`)**:
   - Query Postgres exclusively via the **Kysely** query builder.
   - Enforce region scoping: if user is not `management` or `admin`, restrict queries to `user.region_id` or `user.id`.
   - Block IDOR: check ownership / region before update/delete.
   - Prevent self-approval (e.g. `expense.employee_id !== user.id`).
   - Use database transactions for multi-step mutations.
   - Emit typed domain events via `EventEmitter2` on critical state changes (e.g. `this.eventEmitter.emit('tender.status_changed', payload)`).

3. **Controller (`<module>.controller.ts`)**:
   - Apply `@UseGuards(JwtAuthGuard, RolesGuard)` at controller or route level.
   - Decorate endpoints with `@Roles(...)` according to the permission matrix.
   - Provide standard CRUD endpoints:
     - `GET /api/<module>` (paginated + filters)
     - `GET /api/<module>/:id` (detail with related entities)
     - `POST /api/<module>` (create + emit event)
     - `PATCH /api/<module>/:id` (update + optimistic locking via `updated_at`)
     - `PATCH /api/<module>/:id/status` (guarded status transition)
     - `DELETE /api/<module>/:id` (soft-delete or guarded removal)

---

## 2. Shared Types & Contracts

- Export interfaces, DTO schemas, and status enums in `packages/shared`.
- Ensure frontend and backend consume the exact same types.

---

## 3. Frontend Views & Components

1. **List View (`page.tsx`)**:
   - Render dense, high-performance data table using shadcn primitives.
   - Search input, column sort, and role-appropriate filter dropdowns.
   - Inline status badges with contextual colors.
   - Highlight critical deadlines (e.g. red pulsing badge for tender bids closing in <= 7 days).
   - Empty state inviting user action when no records exist.
   - Loading skeleton state during fetch.

2. **Detail & Create/Edit (`[id]/page.tsx`, `new/page.tsx` or modal dialog)**:
   - Clean form with proper validation (Indian phone `+91`, email, required fields).
   - Formatted numbers in Indian format (`₹ 1,00,000`, Lakh, Crore).
   - Formatted dates in IST (`Asia/Kolkata`).
   - Guarded status transition controls (only allowable next states visible to authorized roles).
   - History / audit trail timeline tab showing who changed what.

---

## 4. Realtime & Notifications Wiring

- Listen for WebSocket events in frontend (`useWebSocket`) to trigger optimistic updates, badge increments, or toast alerts without page refresh.
- Event listeners in backend write to `notifications` table, `audit_log` table, and push via `EventsGateway`.

---

## 5. Verification

- Run `pnpm typecheck` to confirm zero type errors.
- Run e2e tests covering authentication, RBAC restriction, and audit emission.
- Perform browser verification logged in as the primary role and an unauthorized role.
