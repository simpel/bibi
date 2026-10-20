import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type PricedDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** Formatted price with its unit, e.g. "250 kr per person"; null = no price. */
  price: string | null;
  /** Formatted VAT, e.g. "12 %"; null = the venue default. */
  vat?: string | null;
  vatLabel?: string;
};

/** PRICED capability: price and unit, plus VAT when set. */
export function PricedDisplay({ price, vat, vatLabel, ...rest }: PricedDisplayProps) {
  const rows = [
    ...(price ? [{ value: price }] : []),
    ...(vat ? [{ label: vatLabel, value: vat }] : []),
  ];
  return <CapabilityDisplay capability="PRICED" rows={rows} {...rest} />;
}
