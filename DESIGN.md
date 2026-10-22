---
name: "Bibi Design System"
version: "1.0.0"
theme: "Nordic Manor & Heritage"
audience: "B2B conference estates, museums, cultural experience centers, and manor houses"
tokens:
  typography:
    serif: "Fraunces, Source Serif 4, Georgia, serif" # Headings & Hero Financial Totals
    sans: "Inter, ui-sans-serif, system-ui, sans-serif" # Interface, Body, Runsheets & Tabular Figures
  colors:
    background: "oklch(0.992 0.003 85)"
    foreground: "oklch(0.2 0.018 60)"
    card: "oklch(1 0 0)"
    card-foreground: "oklch(0.2 0.018 60)"
    popover: "oklch(1 0 0)"
    popover-foreground: "oklch(0.2 0.018 60)"
    primary: "oklch(0.38 0.075 155)"
    primary-foreground: "oklch(0.985 0.008 85)"
    secondary: "oklch(0.96 0.005 85)"
    secondary-foreground: "oklch(0.24 0.018 60)"
    accent: "oklch(0.95 0.018 75)"
    accent-foreground: "oklch(0.25 0.04 60)"
    muted: "oklch(0.965 0.004 85)"
    muted-foreground: "oklch(0.46 0.018 65)"
    border: "oklch(0.915 0.006 85)"
    input: "oklch(0.895 0.008 85)"
    ring: "oklch(0.38 0.075 155)"
    destructive: "oklch(0.52 0.17 28)"
    warning: "oklch(0.74 0.13 75)"
    success: "oklch(0.54 0.11 150)"
  spacing:
    unit: "0.25rem"
    scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
  radii:
    base: "0.5rem"
    sm: "0.25rem"
    md: "0.375rem"
    lg: "0.5rem"
    xl: "0.75rem"
    full: "9999px"
---

# Bibi Design Guidelines (`DESIGN.md`)

This document defines the visual conventions, design tokens, and interface principles for **Bibi** according to the `@google/design.md` specification. It provides both human-readable rationale and machine-readable tokens for engineers and AI coding assistants.

---

## 1. Overview & Atmosphere

Bibi is a booking and operations system for venues that sell conferences with food and beverage: experience centers (e.g. World of Volvo), museums, conference estates, and manor houses (*herrgårdar*).

- **Visual Tone**: Dignified, calm, crafted, and tactfully high-end. It balances the quiet luxury of Scandinavian hospitality with the unrelenting operational clarity needed for complex runsheets, quotes, and kitchen orders.
- **Atmosphere**: Luminous alabaster and clean chalk daylight surfaces, deep Nordic Spruce primary accents, aged brass warmth, and rich espresso slate typography.
- **Core Principle**: *The system is a bespoke tool for hospitality professionals.* Never sacrifice operational legibility for frivolous decoration.

---

## 2. Core Philosophy: Dieter Rams' 10 Principles for Modern Web Development

Good software design is rooted in restraint, honesty, and usability. We adapt Dieter Rams’ ten seminal design principles (*"Zehn Thesen für gutes Design"*) directly to modern frontend engineering and web development:

1. **Good web design is innovative**
   Employs modern web platform standards (native semantic elements, OKLCH color space, container queries, modern CSS) to solve real workflow problems, rather than adopting technical gimmicks or chasing visual fads for novelty's sake.

2. **Good web design makes a product useful**
   Software exists to be used. In Bibi, every screen, table, and form optimizes for workflow efficiency, data legibility, and high-stakes operational accuracy. Form strictly serves functional task completion.

3. **Good web design is aesthetic**
   Visual harmony directly reduces cognitive fatigue during intense 12-hour event shifts. Dignified typography, disciplined spatial rhythm, and a serene Nordic palette create an interface that is calming, clear, and reassuring.

4. **Good web design makes a product understandable**
   The interface explains itself. Clear visual hierarchy, self-evident affordances, predictable navigation patterns, and unambiguous state feedback ensure that complex operations (e.g. room splits, multi-day banquet agendas) can be operated intuitively without a manual.

5. **Good web design is unobtrusive**
   Software tools are neither decorative art nor self-aggrandizing monuments. The UI remains neutral and restrained, staying in the background so that the venue’s actual operations—guests, runsheets, menus, and rooms—remain the focus.

6. **Good web design is honest**
   Never deceive or manipulate. Strictly avoid dark patterns, artificial delays, layout shifts (CLS), or ambiguous feedback. Communicate system state honestly: if a background save is pending, show it; if an error occurs, explain what happened and how to recover.

7. **Good web design is long-lasting**
   Transcends transient web fashion cycles (skeuomorphic excess, neon brutalism, arbitrary micro-trends). Built on timeless typographic craft and clean geometric layout, ensuring the system feels contemporary and dignified five or ten years from now.

8. **Good web design is thorough down to the last detail**
   Nothing is arbitrary or left to chance. Every interactive state (`hover`, `active`, `focus-visible`, `disabled`), microcopy label, empty state, keyboard sequence, and data format is considered and refined with care and precision.

9. **Good web design is environmentally conscious & resource-efficient**
   Software consumes energy and device resources. We minimize client bundle sizes, eliminate layout thrashing, optimize Core Web Vitals (LCP, INP, CLS), support dark mode for battery and OLED efficiency, and avoid CPU-heavy animations that drain battery life.

10. **Good web design is as little design as possible (*"Weniger, aber besser"* / Less, but better)**
    Concentrate on the essential aspects rather than burdening the user with non-essentials. Back to purity, back to simplicity: strip away unnecessary borders, visual noise, redundant badges, and gratuitous animations. If an element does not aid comprehension or utility, eliminate it.

### Accessibility as a Fundamental Requirement (WCAG 2.2)
Under Dieter Rams' principles of usefulness, clarity, and thoroughness, **accessibility is non-negotiable**. Good design is inherently inclusive:
- **Always follow WCAG 2.2 Level AA standards as an absolute baseline** (targeting AAA where feasible for text contrast).
- **Perceivable**: Maintain strict contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components; Bibi targets > 15:1 for foreground canvas text). Ensure information is never conveyed by color alone.
- **Operable**: All functionality must be 100% accessible via keyboard alone. Interactive components must display clear, high-contrast focus rings (`focus-visible:ring-2 ring-ring`). Support screen readers with logical heading hierarchies and semantic landmarks (`<main>`, `<nav>`, `<aside>`, `<dialog>`).
- **Understandable**: Consistent terminology, predictable navigation, informative error states with inline remediation, and clear form labeling (`label[for]`, `aria-describedby`).
- **Robust**: Valid, standards-compliant HTML; respect user system preferences including `prefers-reduced-motion`, `prefers-color-scheme`, and `prefers-contrast`.

---

## 3. Color System & Semantic Roles

All color definitions are declared in [`packages/ui/src/styles/tokens.css`](file:///Users/joelsanden/Code/bibi/packages/ui/src/styles/tokens.css) using the perceptual OKLCH color space.

```yaml
colors:
  surfaces:
    canvas: "var(--background)" # Luminous alabaster (oklch 0.992 0.003 85)
    card: "var(--card)" # Crisp clean white (oklch 1 0 0)
    popover: "var(--popover)" # Pure white floating surface
    sidebar: "var(--sidebar)" # Subtle architectural tint (oklch 0.984 0.003 85)
  actions:
    primary: "var(--primary)" # Deep Nordic Spruce green (oklch 0.38 0.075 155)
    primary-foreground: "var(--primary-foreground)" # Crisp linen ivory (oklch 0.985 0.008 85)
    secondary: "var(--secondary)" # Limestone pebble (oklch 0.96 0.005 85)
    accent: "var(--accent)" # Warm aged brass honey (oklch 0.95 0.018 75)
  feedback:
    success: "var(--success)" # Meadow sage green (oklch 0.54 0.11 150)
    warning: "var(--warning)" # Honey amber gold (oklch 0.74 0.13 75)
    destructive: "var(--destructive)" # Heritage madder terracotta (oklch 0.52 0.17 28)
```

### Color Rules
- **High Contrast**: Canvas text (`--foreground`) provides > 15:1 contrast against `--background` (WCAG AAA). Primary button text provides > 10:1 contrast against `--primary`.
- **Primary Restraint**: `--primary` (Nordic Spruce) is reserved for primary actions, active navigation states, and brand anchors. Do not use primary colors as decorative card backgrounds.
- **Single Source of Truth**: Never hardcode hex, rgb, or oklch values in components. Always use semantic Tailwind token classes (`bg-primary`, `text-muted-foreground`, `border-border`).

---

## 4. Typography & Hierarchy (Editorial Estate)

Bibi pairs two typefaces—**Fraunces** and **Inter**—mapped strictly by functional purpose:

```yaml
typography:
  brand_wordmark:
    family: "Cherry Bomb One"
    purpose: "Brand identity, app logo, and main navigation wordmark"
    class: "font-wordmark text-foreground"
  display_and_headings:
    family: "Fraunces (Light 300 / Regular 400)"
    purpose: "Page headers, section titles, proposal headlines"
    class: "font-serif text-black dark:text-white"
  hero_financial_totals:
    family: "Fraunces (Light 300)"
    purpose: "Grand quotation totals, hero invoice sums, master pricing"
    class: "font-serif text-2xl font-light text-black dark:text-white"
  interface_and_body:
    family: "Inter"
    purpose: "Body copy, form fields, buttons, table cells, navigation"
    class: "font-sans text-foreground"
  runsheets_and_tabular:
    family: "Inter (OpenType tabular-nums)"
    purpose: "Clock times (08:30 – 17:00), line item prices, capacity counts (240 pers)"
    class: "font-sans tabular-nums font-medium"
  reference_identifiers:
    family: "Inter (Tracked Caps)"
    purpose: "Booking codes (TKT-2026-4401), reference tags"
    class: "font-sans text-xs tracking-wider uppercase font-medium"
```

### Purpose-Driven Typographic Rules
1. **Headings are Always Pitch Black (`#000000` / `text-black`, and `dark:text-white` in dark mode)**:
   Headings never use muted gray or tinted tones. They command immediate, authoritative contrast against the luminous canvas.
2. **Zero Monospace Policy**:
   Fixed-pitch developer monospace fonts (`JetBrains Mono`, `IBM Plex Mono`, `Roboto Mono`) are eliminated from the user-facing UI. Monospace fonts belong in terminal code editors, not in dignified Scandinavian manor and cultural venue tools. Instead, we use **Inter with OpenType `tabular-nums`**, providing perfect vertical column alignment down financial quote tables and runsheets with zero typewriter clunkiness.
3. **Hero Totals as Editorial Statements**:
   Grand totals and key proposal figures (e.g. `184 500 SEK`) use **Fraunces Light** numerals, echoing the refined typographic craftsmanship of a bespoke menu at a Michelin-starred estate.
4. **No Decorative Eyebrows or Pre-headers**:
   Eliminate decorative uppercase eyebrows (e.g. `KONFERENS & HÖSTBANKETT` sitting above an `h1`), floating mini-pills, and filler subtitle chips. Headings must stand cleanly and confidently on their own without decorative clutter.

### Hero Numbers & Number Flow Design Element

In Bibi, a **Hero Number** represents the operational or financial climax of an experience—such as a grand quotation total (`184 500 SEK`), master venue capacity (`380 gäster`), or year-to-date conference turnover.

```yaml
hero_numbers:
  typography:
    family: "Fraunces Light (weight 300, opsz)"
    color: "Pitch black (#000000 in light mode, text-white in dark mode)"
    scale: "text-2xl (24px) to text-5xl (48px)"
  flow_element:
    engine: "@number-flow/react (https://number-flow.barvian.me/)"
    component: "HeroNumber & NumberFlow (@bibi/ui)"
    behavior: "Smooth, organic rolling digit transitions when totals or guest counts update"
    accessibility: "Full WCAG compliance and automatic prefers-reduced-motion support"
```

#### Usage Rules for Hero Numbers & Number Flow
1. **Singular Focus**: Only one number per view or section qualifies as a Hero Number. Do not turn routine table cells into hero figures.
2. **Smooth Transitions with Number Flow**: Use `<HeroNumber />` (or `<NumberFlow />`) for live financial updates and capacity changes. As items, discounts, or headcounts are modified, digits spin and roll organically without layout shift.
3. **Typography Integrity**: The rolling digits must render in **Fraunces Light 300** in pitch black (`text-black dark:text-white`), preserving the stately editorial aesthetic of an estate proposal.
4. **No Typewriter Monospace**: Upstream line item breakdowns and calculation rows use Inter with OpenType `tabular-nums` (`font-sans tabular-nums font-semibold`). Hero numbers always use Fraunces Light.

### Scale & Purpose Table

| Level / Purpose | Tailwind Classes | Family | Color & Usage |
|---|---|---|---|
| **Display Hero** | `text-4xl font-normal tracking-tight` | Fraunces (300) | `text-black dark:text-white` • Primary page heroes |
| **Heading 1** | `text-3xl font-normal tracking-tight` | Fraunces (300) | `text-black dark:text-white` • Main screen titles |
| **Heading 2** | `text-2xl font-normal tracking-tight` | Fraunces (300) | `text-black dark:text-white` • Section & dialog headers |
| **Heading 3** | `text-xl font-normal tracking-tight` | Fraunces (400) | `text-black dark:text-white` • Card groups, subsection headers |
| **Grand Total** | `font-serif text-2xl font-light` | Fraunces (300) | `text-black dark:text-white` • Quote grand totals (`184 500 SEK`) |
| **Body Large** | `text-lg text-muted-foreground leading-relaxed` | Inter | Introductions and explanatory subtitles |
| **Body Regular**| `text-base leading-relaxed` | Inter | Descriptions, ticket notes, instructions |
| **Body Medium** | `text-sm font-medium` | Inter | Buttons, form labels, table cells, tabs |
| **Caption** | `text-xs text-muted-foreground` | Inter | Helper text, breadcrumbs |
| **Runsheet Time** | `text-xs font-medium tabular-nums` | Inter (`tabular-nums`) | Schedule slots (`08:30 – 17:00`) |
| **Line Price** | `text-sm font-semibold tabular-nums` | Inter (`tabular-nums`) | Itemized rows (`1 850 SEK / kuvert`) |
| **Capacity** | `text-sm font-medium tabular-nums` | Inter (`tabular-nums`) | Headcounts (`240 pers`, `80 / 120 platser`) |
| **Reference ID**| `text-xs tracking-wider uppercase font-medium` | Inter | Ticket codes (`TKT-2026-4401`) |

---

## 5. Layout, Grids & Width Tiers

### 4px Baseline Rhythm
Layout and spacing scale strictly on multiples of `0.25rem` (4px):
- `p-1` (4px): Badge padding, tight icon gaps.
- `p-2` (8px): Button inline padding, input control gaps.
- `p-3` (12px): Compact list item spacing, dropdown padding.
- `p-4` (16px): Standard card padding, form vertical gaps.
- `p-6` (24px): Card content padding, drawer margins.
- `p-8` (32px): Section separation, sheet body padding.

### Page Width Tiers (ADR 0038)
Every page belongs to one of two structural categories:
1. **Contained** (`app/[locale]/(app)/(contained)/`):
   - Standard lists, forms, and detail views wrapped in `PageContainer`.
   - `default` (`max-w-5xl`): Default layout container.
   - `narrow` (`max-w-2xl`): Dedicated single-column forms and reading views.
   - `wide` (`max-w-7xl`): Data-dense tables with numerous columns.
2. **Canvas** (`app/[locale]/(app)/(canvas)/`):
   - Spatial, time-based, or streaming pages (`/` AI assistant, `/calendar`).
   - Occupies full viewport height below the top bar (`h-[calc(100dvh-3.5rem)]`).
   - Manages its own gutters, column centering, and internal scroll areas.

---

## 6. Elevation, Shapes & Radii

```yaml
geometry:
  radii:
    sm: "4px (calc(var(--radius) - 4px))"   # Badges, checkboxes, tags
    md: "6px (calc(var(--radius) - 2px))"   # Buttons, form inputs, dropdown rows
    lg: "8px (var(--radius))"               # Cards, dialog containers, sheets
    xl: "12px (calc(var(--radius) + 4px))"  # Outer modal overlays, assistant panels
    full: "9999px"                          # User avatars, status indicator pills
  shadows:
    xs: "0 1px 1px 0"                       # Subtle resting card / row definition
    sm: "0 1px 3px 0"                       # Interactive hover state, small tooltips
    md: "0 4px 10px -2px"                   # Dropdowns, popovers, floating menus
    lg: "0 12px 28px -6px"                  # Modal dialogs, slide-in sheets
```

---

## 7. Component Guidelines

### Buttons & Interactive Controls
- **Single Primary Rule**: Never place more than one primary button (`bg-primary text-primary-foreground`) in a single view or action group. Secondary actions must use `secondary` or `outline`/`ghost`.
- **Action Verbs**: Always label buttons with specific verbs (`Skicka offert`, `Generera körschema`, `Spara anläggning`), never vague placeholders like `OK` or `Submit`.
- **Interactive State Completeness**: Every clickable element must support `hover`, `active`, `focus-visible`, and `disabled` states. Focus indicators must use `outline-ring/50` or `ring-2 ring-ring`.

### Data Tables & Run Sheets (ADR 0040)
- Table headers use `text-xs font-medium text-muted-foreground` in `font-sans`.
- Monetary amounts and event timestamps must always align right and use `font-sans tabular-nums`.
- State badges use semantic status tokens:
  - Confirmed / Signed: `bg-success/15 text-success`
  - Warning / Hold expiring: `bg-warning/15 text-warning-foreground`
  - Canceled / Released: `bg-destructive/15 text-destructive`

---

## 8. Do's and Don'ts

### Do's
- **Do** practice "as little design as possible": strip away gratuitous borders, dividers, cards, and animations; let typography, spatial rhythm, and content guide the eye.
- **Do** keep headings pitch black (`#000000` / `text-black` in light mode, `dark:text-white` in dark mode) for authoritative hierarchy.
- **Do** treat WCAG 2.2 AA as a strict non-negotiable floor across all views: full keyboard access, high-contrast focus rings, semantic markup, and accessible labels.
- **Do** use `font-serif` (`Fraunces`) for headings and grand financial totals, and `font-sans` (`Inter`) with `tabular-nums` for all interface copy, runsheet timetables, line-item pricing, and capacity counts.
- **Do** format booking and ticket reference IDs in tracked uppercase Inter (`text-xs tracking-wider uppercase font-medium`).
- **Do** test interfaces in both light mode and dark mode via Storybook foundations.
- **Do** keep files under 400 lines of code; decompose complex views into modular feature components.
- **Do** honor page width tiers: forms in `narrow`, lists in `default`, calendar in `canvas`.
- **Do** ensure all text satisfies WCAG 2.2 AA minimum contrast standards (aiming for AAA > 7:1 where possible).

### Don'ts
- **Don't** add decorative "eyebrows" or gratuitous uppercase pre-headers above headings (e.g. `UPPERCASE CHIPS` floating over an `h1`). Headings speak for themselves.
- **Don't** use developer monospace fonts in the UI. Monospace has been eliminated in favor of clean lining tabular numbers (`tabular-nums`).
- **Don't** add decorative elements, borders, icons, cards, or badges without a concrete operational or semantic purpose ("less, but better").
- **Don't** ship any component or screen with accessibility regressions, missing keyboard focus rings (`focus-visible:ring-ring`), or low contrast.
- **Don't** hardcode raw color values (`bg-[#...]`, `text-green-800`, `oklch(...)`) in component files. Use tokens only.
- **Don't** mix sharp 0px corners with rounded pill cards in the same interface layout.
- **Don't** use generic lorem ipsum copy; always write realistic venue, food, and conference data.
- **Don't** write empty catch blocks or omit keyboard focus rings (`focus-visible:ring-ring`).
- **Don't** apply `font-serif` to body copy or table data cells; serifs are reserved for headings and display marks.
