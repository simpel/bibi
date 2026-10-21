import type { Meta, StoryObj } from "@storybook/react-vite";

type SpacingStep = {
  step: string;
  px: number;
  rem: string;
  usage: string;
};

const SPACING_STEPS: SpacingStep[] = [
  { step: "1", px: 4, rem: "0.25rem", usage: "Tight icon gaps, badge vertical padding" },
  { step: "2", px: 8, rem: "0.5rem", usage: "Button inline padding, chip gaps, input icons" },
  { step: "3", px: 12, rem: "0.75rem", usage: "Compact list item spacing, dropdown padding" },
  { step: "4", px: 16, rem: "1.0rem", usage: "Standard card padding, form field vertical gaps" },
  { step: "5", px: 20, rem: "1.25rem", usage: "Drawer gutters, card header separation" },
  { step: "6", px: 24, rem: "1.5rem", usage: "Generous card content padding, dialog margins" },
  { step: "8", px: 32, rem: "2.0rem", usage: "Section separation, sheet body padding" },
  { step: "10", px: 40, rem: "2.5rem", usage: "Grid column gaps, modal dialog padding" },
  { step: "12", px: 48, rem: "3.0rem", usage: "Page header margin, container padding" },
  { step: "16", px: 64, rem: "4.0rem", usage: "Large viewport section separation" },
];

type RadiusStep = {
  name: string;
  variable: string;
  className: string;
  calc: string;
  usage: string;
};

const RADIUS_STEPS: RadiusStep[] = [
  {
    name: "Small",
    variable: "radius-sm",
    className: "rounded-sm",
    calc: "4px (0.25rem)",
    usage: "Status badges, tags, checkboxes",
  },
  {
    name: "Medium",
    variable: "radius-md",
    className: "rounded-md",
    calc: "6px (0.375rem)",
    usage: "Buttons, text inputs, dropdown menu items",
  },
  {
    name: "Large (Base)",
    variable: "radius-lg",
    className: "rounded-lg",
    calc: "8px (0.5rem)",
    usage: "Cards, panels, sheets, dialog containers",
  },
  {
    name: "Extra Large",
    variable: "radius-xl",
    className: "rounded-xl",
    calc: "12px (0.75rem)",
    usage: "Outer modal windows, floating assistant panels",
  },
  {
    name: "Full",
    variable: "rounded-full",
    className: "rounded-full",
    calc: "9999px",
    usage: "User avatars, count badges, pill tabs",
  },
];

type ShadowStep = {
  name: string;
  variable: string;
  className: string;
  elevation: string;
  usage: string;
};

const SHADOW_STEPS: ShadowStep[] = [
  {
    name: "Extra Small (xs)",
    variable: "shadow-xs",
    className: "shadow-xs",
    elevation: "1px resting",
    usage: "Table rows, subtle card borders, resting list cards",
  },
  {
    name: "Small (sm)",
    variable: "shadow-sm",
    className: "shadow-sm",
    elevation: "3px lift",
    usage: "Interactive hover cards, button clicks, small tooltips",
  },
  {
    name: "Medium (md)",
    variable: "shadow-md",
    className: "shadow-md",
    elevation: "10px floating",
    usage: "Dropdown menus, select popovers, floating command bars",
  },
  {
    name: "Large (lg)",
    variable: "shadow-lg",
    className: "shadow-lg",
    elevation: "28px modal",
    usage: "Modal dialogs, slide-in sheets, full-screen takeover drawers",
  },
];

function SpacingPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      {/* Header - Spartan, no decorative uppercase eyebrow */}
      <header className="flex flex-col gap-2 border-b pb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
          Rhythm, Radii & Depth
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          The geometric skeleton of Okazi: a strict 4px baseline grid, tailored architectural corner
          radii, and warm-tinted depth shadows designed to give tactile elegance to operational
          surfaces.
        </p>
      </header>

      {/* Spacing Scale */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            4px Spacing Rhythm
          </h2>
          <p className="text-xs text-muted-foreground">
            Multiples of 0.25rem ensure strict typographic and layout alignment.
          </p>
        </div>
        <div className="flex flex-col divide-y rounded-lg border bg-card shadow-xs">
          {SPACING_STEPS.map((s) => (
            <div
              key={s.step}
              className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex w-44 items-baseline gap-2">
                <span className="font-sans text-xs font-semibold tabular-nums text-foreground">
                  step-{s.step}
                </span>
                <span className="font-sans text-xs tabular-nums text-muted-foreground">
                  {s.px}px / {s.rem}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-4">
                <div
                  className="h-4 rounded-sm bg-primary/20 border border-primary/40"
                  style={{ width: `${s.px * 3}px` }}
                />
                <span className="text-xs text-muted-foreground">{s.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Corner Radii */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Tailored Corner Radii
          </h2>
          <p className="text-xs text-muted-foreground">
            8px base radius with proportional scaling for internal and external nesting.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RADIUS_STEPS.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-xs"
            >
              <div
                className={`flex size-14 shrink-0 items-center justify-center border-2 border-primary/40 bg-accent text-accent-foreground font-sans text-xs font-semibold ${r.className}`}
                style={
                  r.variable === "rounded-full"
                    ? { borderRadius: "9999px" }
                    : { borderRadius: `var(--${r.variable})` }
                }
              >
                {r.name.slice(0, 2)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-sm font-normal text-black dark:text-white">
                  {r.name}
                </span>
                <span className="font-sans text-xs tabular-nums text-muted-foreground">
                  {r.calc}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">{r.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows & Elevation */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Elevation & Shadows
          </h2>
          <p className="text-xs text-muted-foreground">
            Warm-tinted light diffusion via OKLCH color mixing for natural depth.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHADOW_STEPS.map((sh) => (
            <div
              key={sh.name}
              className={`flex flex-col gap-3 rounded-lg bg-card p-5 border border-border/40 ${sh.className}`}
              style={{ boxShadow: `var(--${sh.variable})` }}
            >
              <span className="font-serif text-base font-normal text-black dark:text-white">
                {sh.name}
              </span>
              <span className="font-sans text-xs font-medium text-primary">{sh.elevation}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{sh.usage}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Foundations/Spacing & Elevation",
  component: SpacingPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SpacingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {};
