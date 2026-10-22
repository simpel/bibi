import { SectionHeading } from "./section-heading";
import { SPECIMENS } from "./type-specimens-data";

export function TypefaceCards() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
        <span className="font-sans text-xs text-muted-foreground">Headings & Grand Totals</span>
        <p className="font-serif text-2xl font-light text-black dark:text-white">Fraunces 300</p>
        <p className="text-xs text-muted-foreground">
          Optical sizes, generous letterforms, literary elegance. Headings, app title, and editorial
          quotation grand totals.
        </p>
        <code className="mt-2 text-[11px] text-primary">
          var(--font-heading) / var(--font-price-hero)
        </code>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
        <span className="font-sans text-xs text-muted-foreground">Interface & Body</span>
        <p className="font-sans text-2xl font-semibold text-foreground">Inter</p>
        <p className="text-xs text-muted-foreground">
          Contemporary grotesque with clean vertical metrics. Buttons, inputs, data grid, and body
          copy.
        </p>
        <code className="mt-2 text-[11px] text-primary">var(--font-body)</code>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
        <span className="font-sans text-xs text-muted-foreground">Runsheets & Line Numbers</span>
        <p className="font-sans text-2xl font-semibold tabular-nums text-foreground">
          Inter tabular-nums
        </p>
        <p className="text-xs text-muted-foreground">
          Lining tabular numerals with identical horizontal advance widths. Agendas, line items, and
          ticket IDs.
        </p>
        <code className="mt-2 text-[11px] text-primary">tabular-nums (OpenType)</code>
      </div>
    </section>
  );
}

export function TypeScaleSection() {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeading
        title="Type Scale & Purpose Map"
        description="Purpose-driven typography scale from display heroes down to tabular runsheet times."
      />
      <div className="flex flex-col divide-y rounded-lg border bg-card shadow-xs">
        {SPECIMENS.map((spec) => (
          <div
            key={spec.role}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <div className="flex w-64 shrink-0 flex-col gap-1">
              <span className="font-sans text-xs font-semibold text-foreground">{spec.role}</span>
              <span className="font-sans text-[11px] tabular-nums text-muted-foreground">
                {spec.font} • {spec.size}
              </span>
              <span className="text-[11px] text-muted-foreground">{spec.meta}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={spec.tokenClass}>{spec.sample}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
