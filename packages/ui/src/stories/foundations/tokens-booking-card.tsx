function BookingSummary() {
  return (
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
        <span className="font-sans text-xs text-muted-foreground">Offertbelopp (exkl. moms)</span>
        <span className="font-serif text-2xl font-light text-black dark:text-white">
          184 500 SEK
        </span>
        <span className="font-sans text-xs font-medium text-success">✓ Signerad & låst</span>
      </div>
    </div>
  );
}

function BookingFacts() {
  return (
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
  );
}

function BookingActions() {
  return (
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
  );
}

export function BookingCompositionCard() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-md">
      <BookingSummary />
      <div className="my-5 border-t" />
      <BookingFacts />
      <BookingActions />
    </div>
  );
}
