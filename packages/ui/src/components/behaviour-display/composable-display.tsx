import { BehaviourDisplay, type BehaviourDisplayProps } from "./behaviour-display";

export type ComposableDisplayProps = Omit<BehaviourDisplayProps, "behaviour" | "rows"> & {
  /** One formatted line per part, e.g. "2 × Coffee". */
  parts: readonly string[];
};

/** COMPOSABLE behaviour: the parts an item contains. */
export function ComposableDisplay({ parts, ...rest }: ComposableDisplayProps) {
  return (
    <BehaviourDisplay behaviour="COMPOSABLE" rows={parts.map((value) => ({ value }))} {...rest} />
  );
}
