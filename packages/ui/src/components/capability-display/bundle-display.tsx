import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type BundleDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** One formatted line per part, e.g. "2 × Coffee". */
  parts: readonly string[];
};

/** BUNDLE capability: the parts an item contains. */
export function BundleDisplay({ parts, ...rest }: BundleDisplayProps) {
  if (parts.length === 0) return null;
  return (
    <CapabilityDisplay capability="BUNDLE" rows={parts.map((value) => ({ value }))} {...rest} />
  );
}
