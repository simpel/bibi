import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";
import { parsePrice } from "./parse-price";

export type PricedDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** Formatted price with its unit, e.g. "250 kr per person"; null = no price. */
  price: string | null;
  /** Explicit unit override, e.g. "per person" or "/ hour". */
  unit?: string | null;
  /** Formatted VAT, e.g. "12 %"; null = the venue default. */
  vat?: string | null;
  vatLabel?: string;
};

/** PRICED capability: price and unit, plus VAT when set. */
export function PricedDisplay({
  price,
  unit: explicitUnit,
  vat,
  vatLabel,
  variant,
  density,
  className,
  ...rest
}: PricedDisplayProps) {
  if (!price) return null;

  const { amount, unit } = parsePrice(price, explicitUnit);
  const isPlain = variant === "plain";

  return (
    <CapabilityDisplay
      capability="PRICED"
      variant={variant}
      density={density}
      className={className}
      {...rest}
    >
      <div className={isPlain ? "flex flex-col gap-0.5" : "flex flex-col gap-1.5"}>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={
              isPlain
                ? "font-sans text-base font-semibold tracking-tight text-foreground tabular-nums"
                : "font-sans text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl"
            }
          >
            {amount}
          </span>
          {unit ? (
            <span className="font-sans text-xs font-normal text-muted-foreground sm:text-sm">
              {unit}
            </span>
          ) : null}
        </div>

        {vat ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center rounded-sm border border-border/50 bg-muted/40 px-1.5 py-0.5 font-sans text-[11px] font-normal text-muted-foreground">
              {vatLabel ? `${vatLabel}: ${vat}` : `VAT: ${vat}`}
            </span>
          </div>
        ) : null}
      </div>
    </CapabilityDisplay>
  );
}
