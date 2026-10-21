import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "../components/wordmark/wordmark";

const CORE_COLORS = [
  { name: "background", fg: "foreground", label: "Canvas" },
  { name: "card", fg: "card-foreground", label: "Card Surface" },
  { name: "primary", fg: "primary-foreground", label: "Spruce Primary" },
  { name: "accent", fg: "accent-foreground", label: "Aged Brass" },
  { name: "secondary", fg: "secondary-foreground", label: "Limestone" },
  { name: "muted", fg: "muted-foreground", label: "Muted" },
  { name: "success", fg: "success-foreground", label: "Meadow Sage" },
  { name: "warning", fg: "warning-foreground", label: "Amber Honey" },
  { name: "destructive", fg: "destructive-foreground", label: "Madder Red" },
] as const;

const RADIUS_TOKENS = [
  { name: "sm", label: "4px", className: "rounded-sm" },
  { name: "md", label: "6px", className: "rounded-md" },
  { name: "lg", label: "8px (Base)", className: "rounded-lg" },
  { name: "xl", label: "12px", className: "rounded-xl" },
] as const;

const SHADOW_TOKENS = [
  { name: "xs", label: "1px Subtle", className: "shadow-xs" },
  { name: "sm", label: "3px Lift", className: "shadow-sm" },
  { name: "md", label: "10px Floating", className: "shadow-md" },
  { name: "lg", label: "28px Modal", className: "shadow-lg" },
] as const;

function OverviewPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      {/* Header - Spartan, no decorative uppercase eyebrow */}
      <header className="flex flex-col gap-2 border-b pb-6">
        <div className="flex items-center gap-3">
          <Wordmark size="lg" name="Okazi" />
          <span className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
            Design System
          </span>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          The Nordic Manor & Heritage visual foundation. Built on luminous alabaster surfaces, deep
          Nordic Spruce brand accents, Fraunces serif headings and grand totals, and Inter interface
          copy with OpenType tabular figures.
        </p>
      </header>

      {/* Live Component Composition */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Harmonized Composition (Editorial Estate)
          </h2>
          <p className="text-xs text-muted-foreground">
            A realistic conference booking card showing typography, color, spacing, and elevation
            working in unison without decorative clutter.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-md">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  TKT-2026-4401
                </span>
                <span className="rounded-sm bg-accent px-2 py-0.5 font-sans text-xs font-medium text-accent-foreground">
                  Fas: Bekräftad
                </span>
              </div>
              <h3 className="font-serif text-2xl font-light tracking-tight text-black dark:text-white">
                Nordic Clean Tech Summit 2026
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                Salong Carl Larsson & Terrassen • World of Volvo
              </p>
            </div>

            <div className="flex flex-col items-start rounded-lg bg-muted/40 p-3 sm:items-end">
              <span className="font-sans text-xs text-muted-foreground">
                Offertbelopp (exkl. moms)
              </span>
              <span className="font-serif text-2xl font-light text-black dark:text-white">
                184 500 SEK
              </span>
              <span className="font-sans text-xs font-medium text-success">✓ Signerad & låst</span>
            </div>
          </div>

          <div className="my-5 border-t" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-muted-foreground">Tid & Datum</span>
              <span className="font-sans text-sm font-medium tabular-nums text-foreground">
                24 Nov 2026 • 08:30 – 17:00
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-muted-foreground">Kapacitet & Sittning</span>
              <span className="font-sans text-sm font-medium tabular-nums text-foreground">
                180 gäster (Biosittning)
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-muted-foreground">Servering</span>
              <span className="font-sans text-sm font-medium text-foreground">
                Förmiddagskaffe + 2-rätters lunch
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              Generera körschema
            </button>
            <button
              type="button"
              className="rounded-md bg-secondary px-4 py-2 font-sans text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Visa köksorder
            </button>
            <button
              type="button"
              className="rounded-md border px-4 py-2 font-sans text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Exportera PDF
            </button>
          </div>
        </div>
      </section>

      {/* Core Color Palette */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Core Palette
          </h2>
          <p className="text-xs text-muted-foreground">
            Luminous light neutrals with deep spruce and aged brass accents.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CORE_COLORS.map((c) => (
            <div
              key={c.name}
              className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs"
            >
              <div
                className="flex h-16 items-end p-2.5"
                style={{ background: `var(--${c.name})`, color: `var(--${c.fg})` }}
              >
                <span className="font-serif text-xs font-semibold">Sample</span>
              </div>
              <div className="p-2">
                <p className="font-serif text-xs font-semibold">{c.label}</p>
                <code className="text-[10px] text-muted-foreground">--{c.name}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography System */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Typography by Purpose (Editorial Estate)
          </h2>
          <p className="text-xs text-muted-foreground">
            Two unified typefaces mapped strictly by functional role. Zero developer monospace.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <span className="font-sans text-xs text-muted-foreground">Headings & Display</span>
            <p className="font-serif text-xl font-light text-black dark:text-white">Fraunces 300</p>
            <p className="text-xs text-muted-foreground">
              Editorial warmth and crafted serifs for brand wordmarks and headers.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <span className="font-sans text-xs text-muted-foreground">Hero Financial Totals</span>
            <p className="font-serif text-xl font-light text-black dark:text-white">184 500 SEK</p>
            <p className="text-xs text-muted-foreground">
              Bespoke estate invoice sums and proposal grand totals in Fraunces Light numerals.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <span className="font-sans text-xs text-muted-foreground">Interface & Body</span>
            <p className="font-sans text-xl font-medium text-foreground">Inter Regular</p>
            <p className="text-xs text-muted-foreground">
              Contemporary grotesque for high-density app UI, forms, and descriptions.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <span className="font-sans text-xs text-muted-foreground">Runsheets & Line Items</span>
            <p className="font-sans text-xl font-medium tabular-nums text-foreground">
              08:30 – 17:00
            </p>
            <p className="text-xs text-muted-foreground">
              OpenType tabular-nums for aligned schedule times, line pricing, and seat counts.
            </p>
          </div>
        </div>
      </section>

      {/* Geometry: Radii & Elevation */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
              Corner Radii
            </h2>
            <p className="text-xs text-muted-foreground">Tailored 8px base rhythm.</p>
          </div>
          <div className="flex gap-3">
            {RADIUS_TOKENS.map((r) => (
              <div
                key={r.name}
                className={`flex size-16 flex-col items-center justify-center border-2 border-primary/40 bg-card text-center font-sans text-xs ${r.className}`}
                style={{ borderRadius: `var(--radius-${r.name})` }}
              >
                <span className="font-semibold text-foreground">{r.name}</span>
                <span className="text-[10px] text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
              Elevation Shadows
            </h2>
            <p className="text-xs text-muted-foreground">Warm-tinted depth.</p>
          </div>
          <div className="flex gap-3">
            {SHADOW_TOKENS.map((s) => (
              <div
                key={s.name}
                className={`flex size-16 flex-col items-center justify-center rounded-lg bg-card text-center font-sans text-xs border border-border/40 ${s.className}`}
                style={{ boxShadow: `var(--shadow-${s.name})` }}
              >
                <span className="font-semibold text-foreground">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Foundations/Overview",
  component: OverviewPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof OverviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
