import { useState } from "react";
import { HeroNumber } from "../../components/hero-number/hero-number";

const INITIAL_TOTAL = 184500;

const LINE_ITEMS = [
  { label: "Lokalhyra", amount: "45 000 SEK" },
  { label: "Måltider (240 kuvert)", amount: "96 000 SEK" },
  { label: "Teknik & Värdskap", amount: "43 500 SEK" },
];

const BUTTON_BASE =
  "rounded-md border bg-muted/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted";

type TotalControlsProps = {
  setTotal: (update: (value: number) => number) => void;
};

function TotalControls({ setTotal }: TotalControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setTotal((v) => v + 15000)}
        className={`${BUTTON_BASE} text-foreground`}
      >
        +15 000 SEK
      </button>
      <button
        type="button"
        onClick={() => setTotal((v) => Math.max(0, v - 20000))}
        className={`${BUTTON_BASE} text-foreground`}
      >
        -20 000 SEK
      </button>
      <button
        type="button"
        onClick={() => setTotal(() => INITIAL_TOTAL)}
        className={`${BUTTON_BASE} text-muted-foreground hover:text-foreground`}
      >
        Återställ
      </button>
    </div>
  );
}

function LineItems() {
  return (
    <div className="border-t pt-4">
      <span className="text-xs text-muted-foreground">Kopplade rader i Inter tabular-nums:</span>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LINE_ITEMS.map((item) => (
          <div key={item.label} className="flex flex-col rounded-md bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="font-sans text-sm font-semibold tabular-nums text-foreground">
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoIntro() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-serif text-2xl font-light tracking-tight text-black dark:text-white">
        Hero Numbers with Number Flow
      </h2>
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
        Hero numbers in Bibi represent the financial climax of an offer. Powered by{" "}
        <code className="text-primary font-medium">@number-flow/react</code>, numbers transition
        with smooth rolling digit animations while staying in Fraunces Light numerals in pitch
        black.
      </p>
    </div>
  );
}

export function InteractiveHeroNumberDemo() {
  const [total, setTotal] = useState(INITIAL_TOTAL);

  return (
    <div className="flex w-[48rem] max-w-full flex-col gap-6 p-6 font-sans">
      <DemoIntro />
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <HeroNumber
            value={total}
            label="Totalbelopp offert (exkl. moms)"
            suffix=" SEK"
            statusBadge="✓ Offert bekräftad"
            size="xl"
          />
          <TotalControls setTotal={setTotal} />
        </div>
        <LineItems />
      </div>
    </div>
  );
}
