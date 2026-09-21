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

All views must strictly follow the **Arihant BOS Design System** (documented in `docs/DESIGN_SYSTEM.md` and `.agent/rules/design-system.md`). Dark or black backgrounds are strictly prohibited. Always consume standardized components from `@/components/ui`:

1. **Page Architecture (`page.tsx`)**:
   - Wrap the entire page with `<PageContainer>` (`space-y-6 pb-12 animate-in fade-in duration-200`).
   - Top of page must use `<PageHeader>` with `title`, `description`, `moduleBadge`, and primary action buttons.
   - Key metrics must use `<StatGrid>` and `<StatCard>` with standard semantic variants (`primary`, `emerald`, `amber`, `rose`).
   - Major functional sections must use `<SectionHeader>` with title, subtitle, and badges.
   - Search/filter controls must be wrapped in `<FilterBar>`.
   - Render dense, high-performance data table using `<Table>` and `<Badge>`.
   - Highlight critical deadlines (e.g. red pulsing badge for tender bids closing in <= 7 days).
   - Empty state must use `<EmptyState>` with appropriate icon, title, description, and action button.
   - Loading skeleton state during fetch.

2. **Detail & Create/Edit (`[id]/page.tsx`, `new/page.tsx` or `<Modal>`)**:
   - Clean form built with `<Input>`, `<Select>`, and `<Textarea>`.
   - Proper validation (Indian phone `+91`, email, required fields).
   - Formatted numbers in Indian format (`₹ 1,00,000`, Lakh, Crore via `@arihant/shared`).
   - Formatted dates in IST (`Asia/Kolkata`).
   - Action buttons using `<Button>` with variants (`primary`, `secondary`, `outline`).
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
