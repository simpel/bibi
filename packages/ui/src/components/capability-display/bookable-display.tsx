import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type BookableDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** Formatted default booking length, e.g. "90 min"; null = not set. */
  duration: string | null;
};

/** BOOKABLE capability: the default booking length. */
export function BookableDisplay({ duration, ...rest }: BookableDisplayProps) {
  return (
    <CapabilityDisplay
      capability="BOOKABLE"
      rows={duration ? [{ value: duration }] : []}
      {...rest}
    />
  );
}
