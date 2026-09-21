# Arihant BOS — Workspace Agent Guidelines & Standards

This document establishes the architecture, code rules, UI design system conventions, and component library standards for the Arihant Business Operating System (BOS). All AI agents operating in this repository must adhere strictly to these directives.

---

## 1. UI Design System & Component Library

### Core Aesthetic Principles
- **Strictly Light Executive Aesthetic**: Canvas background is `#F7FBFF`, card surfaces are `#FFFFFF`, borders are `#D6E3F5`.
- **Absolute Ban on Dark/Black Themes**: Dark mode, black backgrounds (`bg-slate-900`, `bg-gray-900`, `bg-black`, `border-slate-800`), or dark cards are strictly prohibited anywhere across the application.
- **Component-Driven Standard**: Never implement custom buttons, raw unstandardized cards, or ad-hoc div wrappers when a standardized design system component exists. Always import UI primitives from `@/components/ui`.

### Design Tokens & Variables

| Category | Token | Value | Tailwind Class | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | Background | `#F7FBFF` | `bg-[#F7FBFF]` | Global page background |
| **Surface** | Card / Panel | `#FFFFFF` | `bg-white` | Primary content card surface |
| **Surface** | Subtle Alt | `#F8FAFC` | `bg-slate-50` / `bg-gray-50/70` | Secondary wells, headers, strips |
| **Border** | Base Border | `#D6E3F5` | `border-[#D6E3F5]` | All cards, dividers, input borders |
| **Border** | Border Hover | `#9FC0F5` | `hover:border-[#9FC0F5]` | Interactive cards, inputs |
| **Brand** | Primary Blue | `#223FA7` | `text-[#223FA7]`, `bg-[#223FA7]` | Buttons, active tabs, primary accents |
| **Brand** | Secondary Blue | `#EAF2FF` | `bg-[#EAF2FF]` | Soft button backgrounds, badge tints |
| **Text** | Primary Text | `#1A1A1A` | `text-[#1A1A1A]` | Titles, headings, main content |
| **Text** | Muted / Secondary | `#5871A5` | `text-[#5871A5]` | Subtitles, helper text, labels |
| **Radius** | Standard Card | `12px` | `rounded-xl` | Standard for all cards, containers |
| **Radius** | Small Controls | `8px` | `rounded-lg` | Buttons, inputs, chips |
| **Radius** | Badges / Pills | Full | `rounded-full` | Status badges, avatar circles |

---

### Standard Component Catalog (`@/components/ui`)

#### 1. Layout & Structure (`@/components/ui/Layout`, `PageContainer`)
- **`PageContainer`**: Standard page layout wrapper (`space-y-6 pb-12 animate-in fade-in duration-200`). Supports `maxWidth` ('default' | 'narrow' | 'wide' | 'full').
- **`PageHeader`**: Top hero banner with title, description, module badge, icon, and action button slots.
- **`SectionHeader`**: Subheading divider for logical page divisions, supporting actions and right-aligned badges.
- **`Container`**: Horizontal centered container with responsive paddings and `maxWidth` options.
- **`Stack` / `VStack` / `HStack`**: Flex layout wrappers with standardized `gap` presets (`none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`), alignment, and direction.
- **`Grid`**: CSS grid container with standardized column presets (`1` through `6`, responsive) and gap controls.
- **`Spacer`**: Semantic spacing block (`size="xs" | "sm" | "md" | "lg" | "xl" | "2xl"`).
- **`Divider`**: Semantic horizontal or vertical separator (`border-[#D6E3F5]`) with optional centered label.

#### 2. Surfaces & Cards (`@/components/ui/Card`, `Surface`)
- **`Card`**: Standard surface with border `#D6E3F5`, rounded corners `rounded-xl`, interactive hover states, selection states, and variant tints (`default`, `flat`, `tinted`, `interactive`, `danger`, `warning`, `success`).
  - Subcomponents: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`.
- **`Surface`**: Universal container box with standard background (`canvas`, `card`, `subtle`, `primary`, `danger`, etc.), border, and radius tokens.
- **`Box`**: Lightweight polymorphic element with spacing, padding, and layout props.

#### 3. Typography (`@/components/ui/Typography`)
- **`Heading`**: Standard headings `h1` through `h6` with strict light executive colors (`text-[#1A1A1A]`) and sizing scales.
- **`Text`**: Body text supporting sizes (`xs`, `sm`, `base`, `lg`), weights, and colors (`default`, `muted` `#5871A5`, `primary` `#223FA7`, `success`, `danger`, `warning`).
- **`Label`**: Form field label with optional `required` asterisk indicator.
- **`Kbd`**: Keyboard shortcut pill badge (`border-[#D6E3F5]`, `bg-[#F8FAFC]`).

#### 4. Buttons & Actions (`@/components/ui/Button`)
- **`Button`**: Primary interactive element.
  - Variants: `primary` (`#223FA7`), `secondary` (`#EAF2FF`), `outline`, `ghost`, `danger`, `success`, `cyber`.
  - Sizes: `xs`, `sm`, `md`, `lg`, `icon`.
  - Props: `isLoading`, `leftIcon`, `rightIcon`, `fullWidth`, `disabled`.
- **`IconButton`**: Standardized square or circular icon action button with hover effects and tooltip label accessibility.
- **`ButtonGroup`**: Connected button cluster for toolbars, filters, and segmented actions.

#### 5. Form Controls (`@/components/ui/Input`, `Select`, `Textarea`, `Checkbox`)
- **`Input`**: Text input with label, helperText, error state, and brand focus ring (`focus:border-[#223FA7] focus:ring-[#223FA7]/15`).
- **`Select`**: Dropdown select with standardized styling and label/error support.
- **`Textarea`**: Multi-line text input with standardized focus and border styling.
- **`Checkbox`**: Branded checkbox control with label, sub-description, and executive blue focus/check indicators.

#### 6. Navigation & Filtering (`@/components/ui/Tabs`, `FilterBar`)
- **`Tabs`**: Standard tab navigation supporting `pills`, `segmented`, and `underline` visual variants, with item badge counters and icons.
- **`FilterBar`**: Standardized container for search inputs, dropdown filters, quick toggles, and action triggers.

#### 7. Feedback, Metrics & Dialogue (`@/components/ui/StatCard`, `EmptyState`, `InfoCallout`, `Badge`, `Modal`)
- **`StatGrid` & `StatCard`**: Standard executive metric HUDs with trend subtext, progress bars, and semantic color variants (`primary`, `emerald`, `amber`, `rose`).
- **`EmptyState`**: Empty list / search zero-state with icon, title, description, and action button.
- **`InfoCallout`**: Semantic alerts (`info`, `warning`, `danger`, `success`, `neutral`) with optional dismissible `onClose` action.
- **`Badge`**: Status pills with semantic coloring (`default`, `outline`, `success`, `warning`, `danger`, `urgent`, `info`, `cyber`).
- **`Modal`**: Standard accessible dialog modal with header, description, dismiss button, and standardized padding.
- **`Table`**: Standard tabular presentation with `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`.

---

## 2. Fullstack Architecture Standards

### Backend API (NestJS + Kysely)
- **Kysely Queries**: Use Kysely query builder exclusively for PostgreSQL database interactions.
- **RBAC & Territorial Scoping**: Always enforce role boundaries. Unless the user is `management` or `admin`, filter queries by `user.region_id` or `user.id`.
- **Domain Events**: Emit events using `EventEmitter2` on critical entity transitions (e.g. `tender.status_changed`, `demo.assigned`).

### Shared Package (`@arihant/shared`)
- Share all DTO schemas, status enums, permission matrix types, and currency formatters (`formatINR`, `formatLakh`, `formatCrore`) between backend and frontend.

---

## 3. Verification Protocol
Before marking any task as complete:
1. Run `pnpm --filter @arihant/web exec tsc --noEmit` — must exit with 0 errors.
2. Run `pnpm --filter @arihant/api exec tsc --noEmit` — must exit with 0 errors.
3. Test views in browser to ensure all components render properly with `#F7FBFF` background and `#FFFFFF` cards.
