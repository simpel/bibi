import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type CustomisationsDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** One formatted line per customisation group, e.g. "Main course: pick 1". */
  groups: readonly string[];
};

/** CUSTOMISATIONS capability: the customisation groups among the parts. */
export function CustomisationsDisplay({ groups, ...rest }: CustomisationsDisplayProps) {
  if (groups.length === 0) return null;
  return (
    <CapabilityDisplay
      capability="CUSTOMISATIONS"
      rows={groups.map((value) => ({ value }))}
      {...rest}
    />
  );
}
