import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type LayoutsDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** What the room is limited by, already formatted, e.g. "Max number of people" and "80". */
  rows: readonly { label: string; value: string }[];
};

/** SETUPS capability (called Layouts in the UI): the room's limits; its layouts are drawn below. */
export function LayoutsDisplay({ rows, ...rest }: LayoutsDisplayProps) {
  if (rows.length === 0) return null;
  return <CapabilityDisplay capability="SETUPS" rows={rows} {...rest} />;
}
