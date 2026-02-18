# Design Specification — EMA (Employee Management App)

This document defines the visual language, design tokens, component patterns, and page layouts for the application redesign. Use it as the single source of truth when updating Tailwind theme config, CSS variables, and UI components.

---

## 1. Brand Identity and Color Palette

The palette is derived directly from the **Pepl logo**, which contains three colours:

| Source | Colour | Approximate HSL | Role in design system |
|--------|--------|-----------------|----------------------|
| Logo "P" + "e" (left) | **Dark Navy** | `220 70% 22%` | Primary — sidebar background, primary buttons, headings |
| Logo "p" + "l" (right) | **Sky Blue** | `200 80% 55%` | Accent — active states, links, highlights, focus rings |
| Logo swoosh figure | **Silver** | `210 15% 72%` | Neutral reference — informs border, muted, and divider tones |

### Full token table

| Token | Light mode HSL | Dark mode HSL | Usage |
|-------|----------------|---------------|-------|
| **primary** | `220 70% 22%` | `200 75% 58%` | Primary buttons, sidebar bg, key actions |
| **primary-foreground** | `0 0% 100%` | `220 50% 10%` | Text on primary surfaces |
| **accent** | `200 80% 55%` | `200 72% 62%` | Active nav, links, focus rings, highlights |
| **accent-foreground** | `0 0% 100%` | `220 50% 10%` | Text on accent surfaces |
| **secondary** | `215 25% 95%` | `220 30% 16%` | Subtle backgrounds, hover states |
| **secondary-foreground** | `220 50% 25%` | `210 25% 88%` | Text on secondary surfaces |
| **muted** | `215 18% 93%` | `220 22% 15%` | Muted backgrounds, disabled areas |
| **muted-foreground** | `215 15% 48%` | `215 18% 60%` | Captions, placeholders, secondary text |
| **background** | `210 15% 98%` | `220 35% 9%` | Page background |
| **foreground** | `220 50% 12%` | `210 20% 95%` | Primary body text |
| **card** | `0 0% 100%` | `220 30% 12%` | Card/panel surfaces |
| **card-foreground** | `220 50% 12%` | `210 20% 95%` | Text inside cards |
| **popover** | `0 0% 100%` | `220 30% 12%` | Popover/dropdown surfaces |
| **popover-foreground** | `220 50% 12%` | `210 20% 95%` | Text inside popovers |
| **border** | `215 20% 88%` | `220 25% 22%` | Borders, dividers |
| **input** | `215 20% 88%` | `220 25% 22%` | Input field borders |
| **ring** | `200 80% 55%` | `200 72% 62%` | Focus ring (sky blue) |
| **destructive** | `0 72% 51%` | `0 62% 42%` | Destructive / error actions |
| **destructive-foreground** | `0 0% 100%` | `210 20% 98%` | Text on destructive |
| **sidebar** | `220 70% 22%` | `220 45% 12%` | Sidebar background (dark navy) |
| **sidebar-foreground** | `210 15% 80%` | `210 20% 80%` | Text inside sidebar (silver-toned) |
| **sidebar-accent** | `200 80% 55%` | `200 72% 62%` | Active item in sidebar (sky blue) |

### Semantic colours

| Token | HSL | Usage |
|-------|-----|-------|
| **success** | `145 55% 42%` | Positive status, confirmations |
| **success-foreground** | `0 0% 100%` | Text on success |
| **warning** | `38 92% 50%` | Warnings, expiring-soon badges |
| **warning-foreground** | `38 90% 10%` | Text on warning |
| **error** | `0 72% 51%` | Errors (same as destructive) |
| **info** | `200 80% 55%` | Informational (same as accent / sky blue) |

### CSS variable block — `src/styles/globals.css`

```css
@layer base {
  :root {
    --background: 210 15% 98%;
    --foreground: 220 50% 12%;
    --card: 0 0% 100%;
    --card-foreground: 220 50% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 50% 12%;
    --primary: 220 70% 22%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 25% 95%;
    --secondary-foreground: 220 50% 25%;
    --muted: 215 18% 93%;
    --muted-foreground: 215 15% 48%;
    --accent: 200 80% 55%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 20% 88%;
    --input: 215 20% 88%;
    --ring: 200 80% 55%;
    --radius: 0.75rem;
    /* Sidebar (dark navy) */
    --sidebar: 220 70% 22%;
    --sidebar-foreground: 210 15% 80%;
    --sidebar-accent: 200 80% 55%;
    /* Semantic */
    --success: 145 55% 42%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 38 90% 10%;
    /* Charts */
    --chart-1: 220 70% 22%;
    --chart-2: 200 80% 55%;
    --chart-3: 145 55% 42%;
    --chart-4: 38 92% 50%;
    --chart-5: 0 72% 51%;
  }

  .dark {
    --background: 220 35% 9%;
    --foreground: 210 20% 95%;
    --card: 220 30% 12%;
    --card-foreground: 210 20% 95%;
    --popover: 220 30% 12%;
    --popover-foreground: 210 20% 95%;
    --primary: 200 75% 58%;
    --primary-foreground: 220 50% 10%;
    --secondary: 220 30% 16%;
    --secondary-foreground: 210 25% 88%;
    --muted: 220 22% 15%;
    --muted-foreground: 215 18% 60%;
    --accent: 200 72% 62%;
    --accent-foreground: 220 50% 10%;
    --destructive: 0 62% 42%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 25% 22%;
    --input: 220 25% 22%;
    --ring: 200 72% 62%;
    /* Sidebar */
    --sidebar: 220 45% 12%;
    --sidebar-foreground: 210 20% 80%;
    --sidebar-accent: 200 72% 62%;
    /* Semantic */
    --success: 145 50% 48%;
    --success-foreground: 145 30% 10%;
    --warning: 38 88% 55%;
    --warning-foreground: 38 80% 10%;
    /* Charts */
    --chart-1: 200 75% 58%;
    --chart-2: 220 50% 45%;
    --chart-3: 145 50% 48%;
    --chart-4: 38 88% 55%;
    --chart-5: 0 62% 52%;
  }
}
```

### Tailwind config additions — `tailwind.config.js`

Extend `theme.extend.colors` to include sidebar and semantic tokens:

```js
// Inside theme.extend.colors
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",
  foreground: "hsl(var(--sidebar-foreground))",
  accent: "hsl(var(--sidebar-accent))",
},
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
},
warning: {
  DEFAULT: "hsl(var(--warning))",
  foreground: "hsl(var(--warning-foreground))",
},
```

---

## 2. Typography Scale

### Font family

- **Primary:** Inter (Google Fonts). Load in `index.html`:  
  `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
- **Tailwind:** Add to `tailwind.config.js`:
  ```js
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
  },
  ```

### Size scale and line-heights

| Token | Size | Line height | Tailwind class | Use |
|-------|------|-------------|----------------|-----|
| xs | 0.75rem (12px) | 1rem | `text-xs` | Captions, labels, table meta |
| sm | 0.875rem (14px) | 1.25rem | `text-sm` | Body secondary, list items |
| base | 1rem (16px) | 1.5rem | `text-base` | Body primary |
| lg | 1.125rem (18px) | 1.75rem | `text-lg` | Section titles, cards |
| xl | 1.25rem (20px) | 1.75rem | `text-xl` | Page subtitles |
| 2xl | 1.5rem (24px) | 2rem | `text-2xl` | Page title |
| 3xl | 1.875rem (30px) | 2.25rem | `text-3xl` | Hero / dashboard headline |

### Weights

- **400** — Body text
- **500** — Labels, nav items, emphasis
- **600** — Section headings, buttons
- **700** — Page title, card titles

### UI role mapping

| Role | Class | Weight |
|------|-------|--------|
| Page title | `text-2xl font-bold` | 700 |
| Section heading | `text-lg font-semibold` or `text-base font-semibold` | 600 |
| Body | `text-sm` or `text-base` | 400 |
| Caption / meta | `text-xs text-muted-foreground` | 400 |
| Label | `text-sm font-medium` | 500 |
| Badge / chip | `text-xs font-medium` | 500 |

---

## 3. Spacing, Sizing, and Border Tokens

### Spacing

Use Tailwind’s default 4px base unit: `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `5` = 20px, `6` = 24px, `8` = 32px, `10` = 40px, `12` = 48px.

- **Section gap:** `gap-4` or `gap-6`
- **Form field gap:** `gap-2`
- **Card padding:** `p-4` (default), `p-6` for large cards
- **Page padding:** `px-4 py-6` mobile, `px-6 py-8` desktop

### Border radius

- **Default token:** `--radius: 0.75rem` (12px) for a rounder, modern look (replace current `0.5rem`).
- **Usage:** Buttons, inputs, cards, badges use `rounded-lg` (var(--radius)). Use `rounded-xl` (e.g. 1rem) for stat cards and large containers.

Add to `tailwind.config.js` if desired:

```js
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
  xl: "1rem",
},
```

### Elevation / shadow

- **shadow-sm** — Subtle borders/cards: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **shadow-card** — Stat cards, raised panels: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- **shadow-dropdown** — Dropdowns, popovers: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`

Define in Tailwind:

```js
boxShadow: {
  card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  dropdown: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
},
```

### Touch targets

- Minimum interactive size: **44×44px** (e.g. `min-h-[44px] min-w-[44px]` or `h-11 min-w-[44px]`).
- Use for icon buttons, nav items, and form controls on mobile.

---

## 4. Iconography

- **Set:** Lucide React (already in use). Keep as the single icon set.
- **Sizes:**
  - **16px** (`h-4 w-4`) — Inline with text, table cells
  - **20px** (`h-5 w-5`) — Nav items, buttons, header actions
  - **24px** (`h-6 w-6`) — Feature icons, empty states, stat cards
- **Stroke:** Default Lucide stroke (1.5–2). Do not mix with another icon set.

---

## 5. Layout System — Sidebar Navigation

### Structure

```
+------------------+------------------------------------------+
| SIDEBAR          | CONTENT AREA                             |
| (~240px desktop) |                                          |
|                  |  +--------------------------------------+ |
|  Logo            |  | Page header (breadcrumb, search, user) | |
|  Menu            |  +--------------------------------------+ |
|  - Home          |  |                                      | |
|  - Employees     |  |  Page content (scrollable)            | |
|  - Expiring      |  |                                      | |
|  Settings (admin)|  |                                      | |
|  - Team          |  |                                      | |
|  - ...           |  |                                      | |
|  (spacer)        |  |                                      | |
|  User / Logout   |  |                                      | |
+------------------+------------------------------------------+
```

### Breakpoints

- **Desktop (md and up, 768px+):** Sidebar is fixed, full height, width ~240px (`w-60`). Content area uses `flex-1` and scrolls independently.
- **Mobile (&lt; md):** Sidebar is hidden. A hamburger button in the page header opens a **Sheet** (drawer) that contains the same nav. No bottom tab bar; bottom nav is removed.

### Sidebar sections

1. **Logo** — Top; links to Home. Optional app name next to icon.
2. **Menu** — Main nav: Home, Employees, Expiring (Documents).
3. **Settings** (admin only) — Team, Doc Types, Modules, Contract template, Export config.
4. **Spacer** — `flex-1` so the next block sits at bottom.
5. **User / Logout** — Avatar (or initials), name/email if space, logout action.

### Active state

- The sidebar has a **dark navy background** (`bg-sidebar`); nav text is silver-toned (`text-sidebar-foreground`).
- Active nav item: sky-blue text and a subtle sky-blue left border or background highlight.
- Example: `bg-sidebar-accent/15 text-sidebar-accent font-medium border-l-2 border-sidebar-accent` for the active route.
- Hover: `hover:bg-white/8 hover:text-white` (light overlay on dark).

### Key file changes

| File | Change |
|------|--------|
| `src/components/layout/AppShell.tsx` | Restructure to sidebar + content layout; render Sidebar on desktop and Sheet (with same nav) on mobile. |
| `src/components/layout/Header.tsx` | Becomes page-level header inside content area: optional breadcrumb, title, search, user avatar + logout. Rename to `PageHeader.tsx` if desired. |
| `src/components/layout/MobileNav.tsx` | Remove; navigation lives only in Sidebar / Sheet. |
| New: `src/components/layout/Sidebar.tsx` | Renders logo, nav links, settings group, user block. Reused inside Sheet on mobile. |
| New: `src/lib/navConfig.ts` | Single export of `navItems` (and optional settings items) for Sidebar and Sheet. |

### Sidebar styles

- Background: `bg-sidebar` (dark navy from logo — `220 70% 22%`). This gives a strong brand presence.
- Logo area: Pepl logo at top, white or sky-blue version on the dark background.
- Nav text: `text-sidebar-foreground` (silver-toned, `210 15% 80%`).
- Active item: `text-sidebar-accent` (sky blue) + subtle left border or background `bg-sidebar-accent/15`.
- Hover: `hover:bg-white/8 hover:text-white`.
- Nav item base: `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium`.
- Minimum touch height for nav items: 44px.
- Section labels (e.g. "Menu", "Settings"): `text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3 pt-4 pb-1`.

---

## 6. Component Design Tokens

### Buttons

- **Sizes:** `sm` (h-8, text-xs), `default` (h-9 or h-10), `lg` (h-11). Use `min-w-[44px]` for icon-only on mobile.
- **Variants:** primary, secondary, outline, ghost, destructive, link.
- **Radius:** `rounded-lg` (var(--radius)).
- **Padding:** `px-4 py-2` default; icon-only `p-2`.

### Inputs / selects

- **Height:** `h-10` (40px) minimum for touch.
- **Border:** `border border-input rounded-lg`.
- **Focus:** `ring-2 ring-ring ring-offset-2`.
- **Placeholder:** `text-muted-foreground`.
- **Label:** Above field, `text-sm font-medium`, spacing `mb-1.5`.

### Cards

- **Container:** `rounded-lg border bg-card text-card-foreground shadow-sm` or `shadow-card`.
- **Header:** `bg-muted/70 px-4 py-3 border-b`; title `text-sm font-semibold`.
- **Body:** `p-4` or `p-6`.

### Tables / lists

- **Row height:** Min 48px for body rows.
- **Hover:** `hover:bg-muted/50`.
- **Dividers:** `border-b border-border` or no border with row hover.
- **Pagination:** Right-aligned, compact; use `rounded-lg` for page buttons and active state `bg-primary text-primary-foreground`.

### Badges / status

- **Shape:** `rounded-full` or `rounded-md` with `px-2.5 py-0.5 text-xs font-medium`.
- **Semantic:** Success (green), Warning (amber), Error (red), Info (blue) — use semantic colors from palette.
- Example: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400` for “On time”; red equivalents for “Late” or “Absent”.

### Modals / sheets

- **Overlay:** `bg-black/50` or `bg-black/40`.
- **Panel:** `bg-background`, `rounded-lg` or `rounded-xl` (sheet from side can be `rounded-l-xl`).
- **Width:** Sheet default ~320px or 100% on small mobile; modal `max-w-lg` or `max-w-md`.
- **Padding:** `p-6` for content.

### Toasts / alerts

- **Position:** Bottom-right or top-right; avoid covering critical UI.
- **Variants:** default, success, warning, error — border or background using semantic colors.

---

## 7. Page Layout Patterns

### List page (e.g. Employees)

- **Page header:** Title (e.g. “Employees”) `text-2xl font-bold`, optional primary action (e.g. “Add employee”) on the right.
- **Optional stat cards:** Row of 2–4 cards with `rounded-xl shadow-card p-4`, icon + number + label + optional delta.
- **Toolbar:** Search input + filter chips (e.g. “Sort by”, “Designation”) + “More filters” if needed.
- **Table or card list:** Clear headers; rows with avatar, primary text, secondary text, status badge. Pagination below.

```tsx
// List page structure (conceptual)
<div className="space-y-6 p-4 md:p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 className="text-2xl font-bold">Employees</h1>
    <Button>Add employee</Button>
  </div>
  {/* Optional: stat cards row */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">...</div>
  {/* Search + filters */}
  <div className="flex flex-wrap items-center gap-2">...</div>
  {/* Table */}
  <div className="rounded-lg border bg-card">...</div>
  {/* Pagination */}
</div>
```

### Detail page (e.g. Employee detail)

- **Header card:** Avatar (or placeholder), name, subtitle (e.g. role/ID), action buttons (Edit, etc.). Use `rounded-xl shadow-card p-6`.
- **Info sections:** Below, 2–3 section cards in a flex-wrap grid; each with `rounded-lg border bg-card` and section header `bg-muted/70 px-4 py-2 border-b`, then content `p-4` with label/value rows.

```tsx
// Detail page structure (conceptual)
<div className="space-y-6 p-4 md:p-6">
  <div className="rounded-xl border bg-card p-6 shadow-card flex flex-wrap items-start gap-4">
    <Avatar className="h-16 w-16" />
    <div className="flex-1 min-w-0">
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
    <div className="flex gap-2">...</div>
  </div>
  <div className="flex flex-wrap gap-4">
    <section className="rounded-lg border bg-card flex-1 min-w-[280px]">...</section>
    ...
  </div>
</div>
```

### Form page (Add / Edit)

- **Sections:** Each logical group in a card: `rounded-lg border bg-card overflow-hidden` with `bg-muted/70 px-4 py-2 border-b` header and `p-4` body. Use `flex flex-wrap gap-4` for section grid.
- **Sticky footer (optional):** On desktop, submit/cancel bar at bottom with `border-t bg-background p-4`.

```tsx
// Form page structure (conceptual)
<form className="flex flex-col min-h-[60vh]">
  <div className="flex-1 space-y-6 p-4 md:p-6">
    <section className="rounded-lg border bg-card overflow-hidden">
      <div className="bg-muted/70 px-4 py-2 border-b"><h2 className="text-sm font-semibold">Personal</h2></div>
      <div className="p-4 grid gap-4 sm:grid-cols-2">...</div>
    </section>
    ...
  </div>
  <div className="sticky bottom-0 border-t bg-background p-4 flex justify-end gap-2">...</div>
</form>
```

### Settings page

- **Layout:** Either vertical tabs in the sidebar (e.g. “Team”, “Doc Types”, …) with content on the right, or a single scrollable page with accordion/sections. Prefer reusing the same sidebar “Settings” group and each item linking to a route; the settings content area shows one panel per route (no nested sidebar required).

---

## Summary checklist

- [ ] Apply Pepl palette: update `globals.css` with the CSS variable block above (both `:root` and `.dark`).
- [ ] Extend `tailwind.config.js` with sidebar, success, and warning colour tokens.
- [ ] Set `--radius: 0.75rem` and add shadow/card tokens to Tailwind if desired.
- [ ] Add Inter (or chosen font) and `fontFamily.sans` in Tailwind.
- [ ] Implement Sidebar (dark navy bg) + nav config; refactor AppShell and Header; remove MobileNav.
- [ ] Apply component tokens (buttons, inputs, cards, badges, tables) across existing pages.
- [ ] Use list/detail/form layout patterns for Employees, Documents, and Settings.
