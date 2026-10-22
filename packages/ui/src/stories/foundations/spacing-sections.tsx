import { SectionHeading } from "./section-heading";
import {
  RADIUS_STEPS,
  type RadiusStep,
  SHADOW_STEPS,
  type ShadowStep,
  SPACING_STEPS,
  type SpacingStep,
} from "./spacing-data";

function SpacingRow({ s }: { s: SpacingStep }) {
  return (
    <div className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
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
  );
}

export function SpacingScaleSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="4px Spacing Rhythm"
        description="Multiples of 0.25rem ensure strict typographic and layout alignment."
      />
      <div className="flex flex-col divide-y rounded-lg border bg-card shadow-xs">
        {SPACING_STEPS.map((s) => (
          <SpacingRow key={s.step} s={s} />
        ))}
      </div>
    </section>
  );
}

function RadiusCard({ r }: { r: RadiusStep }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-xs">
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
        <span className="font-serif text-sm font-normal text-black dark:text-white">{r.name}</span>
        <span className="font-sans text-xs tabular-nums text-muted-foreground">{r.calc}</span>
        <span className="text-[11px] text-muted-foreground leading-snug">{r.usage}</span>
      </div>
    </div>
  );
}

export function RadiusSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Tailored Corner Radii"
        description="8px base radius with proportional scaling for internal and external nesting."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RADIUS_STEPS.map((r) => (
          <RadiusCard key={r.name} r={r} />
        ))}
      </div>
    </section>
  );
}

function ShadowCard({ sh }: { sh: ShadowStep }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg bg-card p-5 border border-border/40 ${sh.className}`}
      style={{ boxShadow: `var(--${sh.variable})` }}
    >
      <span className="font-serif text-base font-normal text-black dark:text-white">{sh.name}</span>
      <span className="font-sans text-xs font-medium text-primary">{sh.elevation}</span>
      <p className="text-xs text-muted-foreground leading-relaxed">{sh.usage}</p>
    </div>
  );
}

export function ShadowSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Elevation & Shadows"
        description="Warm-tinted light diffusion via OKLCH color mixing for natural depth."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SHADOW_STEPS.map((sh) => (
          <ShadowCard key={sh.name} sh={sh} />
        ))}
      </div>
    </section>
  );
}
