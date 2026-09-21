# Design System Rules & Component Catalog — Arihant BOS

## 1. Absolute Directives
1. **Light Executive Aesthetic ONLY**:
   - The application theme is strictly clean light enterprise (`#F7FBFF` background, `#FFFFFF` cards, `#D6E3F5` borders).
   - **NEVER** use dark, black, or slate backgrounds (such as `bg-slate-900`, `bg-gray-900`, `bg-black`, `border-slate-800`).
   - Dark/black themes are strictly forbidden across all views, modals, cards, sidebars, and widgets.

2. **Mandatory Component Library Usage**:
   - All interactive and structural UI elements must be imported from `@/components/ui`.
   - Never write ad-hoc raw `<button>`, `<input>`, raw `<input type="checkbox">`, or raw `<div>` cards when a standardized component exists.
   - Always use the design tokens below for any inline Tailwind utilities.

---

## 2. Design Tokens Reference

| Token Name | Hex Code / Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F7FBFF` | `bg-[#F7FBFF]` | Whole-page wrapper background |
| **Card Surface** | `#FFFFFF` | `bg-white` | Primary content surfaces |
| **Subtle Well** | `#F8FAFC` | `bg-slate-50` / `bg-gray-50/70` | Secondary wells, sub-panels |
| **Base Border** | `#D6E3F5` | `border-[#D6E3F5]` | All cards, dividers, inputs |
| **Border Hover** | `#9FC0F5` | `hover:border-[#9FC0F5]` | Interactive elements on hover |
| **Primary Brand Blue** | `#223FA7` | `text-[#223FA7]`, `bg-[#223FA7]` | Primary buttons, headers, icons |
| **Secondary Soft Blue** | `#EAF2FF` | `bg-[#EAF2FF]` | Button backgrounds, pills |
| **Primary Text** | `#1A1A1A` | `text-[#1A1A1A]` | Headings, card titles, key values |
| **Muted Text** | `#5871A5` | `text-[#5871A5]` | Sub-labels, captions, secondary info |
| **Border Radius** | `12px` | `rounded-xl` | Standard for all cards and dialogs |
| **Control Radius** | `8px` | `rounded-lg` | Buttons, inputs, chips |

---

## 3. Standard Component Library Catalog (`@/components/ui`)

### Layout & Spacing
- **`PageContainer`**: Standard page layout wrapper (`space-y-6 pb-12 animate-in fade-in duration-200`).
- **`PageHeader`**: Top page banner with title, description, module badge, icon, and action button slots.
- **`SectionHeader`**: Standard section divider with title, subtitle, and action slot.
- **`Container`**: Horizontally centered wrapper with responsive padding.
- **`Stack` / `VStack` / `HStack`**: Standard flex container with token-based `gap` (`none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`) and direction.
- **`Grid`**: Standard CSS grid container with column presets (`cols={1..6}`) and gaps.
- **`Spacer`**: Explicit vertical or horizontal spacing component (`size="xs" | "sm" | "md" | "lg" | "xl" | "2xl"`).
- **`Divider`**: Standard `#D6E3F5` line with optional centered label.

### Surfaces & Cards
- **`Card`**: Standard surface with border `#D6E3F5` and `rounded-xl`.
  - Subcomponents: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`.
  - Props: `variant` (`default`, `flat`, `tinted`, `interactive`, `danger`, `warning`, `success`), `selected`, `padding` (`none`, `xs`, `sm`, `md`, `lg`).
- **`Surface`**: Universal container box with token-mapped background, border, and radius.
- **`Box`**: Lightweight layout wrapper.

### Typography
- **`Heading`**: Standard semantic headings `h1`–`h6` with `#1A1A1A` text color.
- **`Text`**: Standard body typography with predefined sizes and color tokens (`default`, `muted`, `primary`, `success`, `danger`, `warning`).
- **`Label`**: Form field label with optional `required` indicator.
- **`Kbd`**: Keyboard shortcut pill badge (`border-[#D6E3F5]`, `bg-[#F8FAFC]`).

### Buttons & Actions
- **`Button`**: Standard button with variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `cyber`), sizes (`xs`, `sm`, `md`, `lg`, `icon`), `isLoading`, `leftIcon`, `rightIcon`, and `fullWidth`.
- **`IconButton`**: Standard square or circular action button for icons with tooltip support.
- **`ButtonGroup`**: Connected cluster of buttons for segmented controls.

### Form Inputs
- **`Input`**: Standard input field with label, helperText, and `#223FA7` focus ring.
- **`Select`**: Standard dropdown field.
- **`Textarea`**: Standard multiline text input.
- **`Checkbox`**: Branded checkbox with label and optional description.

### Navigation & Filtering
- **`Tabs`**: Standard tabs with `pills`, `segmented`, and `underline` presets, supporting badge counters and icons.
- **`FilterBar`**: Standardized bar for search inputs, filter selectors, and quick toggles.

### Feedback & Overlays
- **`StatGrid` & `StatCard`**: Standardized metric HUD with trend and semantic variants.
- **`EmptyState`**: Empty list/table fallback with icon, title, description, and action.
- **`InfoCallout`**: Semantic alerts (`info`, `warning`, `danger`, `success`, `neutral`) with optional `onClose`.
- **`Badge`**: Status indicator pills (`default`, `outline`, `success`, `warning`, `danger`, `urgent`, `info`, `cyber`).
- **`Modal`**: Standard accessible dialog modal.
- **`Table`**: Standard tabular presentation (`TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`).

---

## 4. Verification Protocol
- Always run `pnpm --filter @arihant/web exec tsc --noEmit` before considering any task complete. Must exit with 0 errors.
- Ensure all pages and modals render properly with `#F7FBFF` background and `#FFFFFF` cards.
