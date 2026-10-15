import { BehaviourDisplay, type BehaviourDisplayProps } from "./behaviour-display";

export type SetupsDisplayProps = Omit<BehaviourDisplayProps, "behaviour" | "rows"> & {
  /** One entry per setup with a capacity; `capacity` is already formatted. */
  setups: readonly { name: string; capacity: string }[];
};

/** SETUPS behaviour: capacity per setup. */
export function SetupsDisplay({ setups, ...rest }: SetupsDisplayProps) {
  const rows = setups.map(({ name, capacity }) => ({ label: name, value: capacity }));
  return <BehaviourDisplay behaviour="SETUPS" rows={rows} {...rest} />;
}
