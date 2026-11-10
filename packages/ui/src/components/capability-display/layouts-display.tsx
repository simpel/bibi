import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type SetupsDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** One entry per setup with a capacity; `capacity` is already formatted. */
  setups: readonly { name: string; capacity: string }[];
};

/** SETUPS capability: capacity per setup. */
export function SetupsDisplay({ setups, ...rest }: SetupsDisplayProps) {
  if (setups.length === 0) return null;
  const rows = setups.map(({ name, capacity }) => ({ label: name, value: capacity }));
  return <CapabilityDisplay capability="SETUPS" rows={rows} {...rest} />;
}
