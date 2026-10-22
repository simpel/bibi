import { SectionHeading } from "./section-heading";
import { CORE_COLORS, RADIUS_TOKENS, SHADOW_TOKENS } from "./tokens-data";

export function CorePaletteSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Core Palette"
        description="Luminous light neutrals with deep spruce and aged brass accents."
      />
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
  );
}

const PURPOSE_CARDS = [
  {
    label: "Headings & Display",
    sample: "Fraunces 300",
    sampleClass: "font-serif text-xl font-light text-black dark:text-white",
    text: "Editorial warmth and crafted serifs for brand wordmarks and headers.",
  },
  {
    label: "Hero Financial Totals",
    sample: "184 500 SEK",
    sampleClass: "font-serif text-xl font-light text-black dark:text-white",
    text: "Bespoke estate invoice sums and proposal grand totals in Fraunces Light numerals.",
  },
  {
    label: "Interface & Body",
    sample: "Inter Regular",
    sampleClass: "font-sans text-xl font-medium text-foreground",
    text: "Contemporary grotesque for high-density app UI, forms, and descriptions.",
  },
  {
    label: "Runsheets & Line Items",
    sample: "08:30 – 17:00",
    sampleClass: "font-sans text-xl font-medium tabular-nums text-foreground",
    text: "OpenType tabular-nums for aligned schedule times, line pricing, and seat counts.",
  },
];

export function TypographyPurposeSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Typography by Purpose (Editorial Estate)"
        description="Two unified typefaces mapped strictly by functional role. Zero developer monospace."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {PURPOSE_CARDS.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs"
          >
            <span className="font-sans text-xs text-muted-foreground">{card.label}</span>
            <p className={card.sampleClass}>{card.sample}</p>
            <p className="text-xs text-muted-foreground">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GeometrySection() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <SectionHeading title="Corner Radii" description="Tailored 8px base rhythm." />
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
        <SectionHeading title="Elevation Shadows" description="Warm-tinted depth." />
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
  );
}
