import { BehaviourDisplay, type BehaviourDisplayProps } from "./behaviour-display";

export type ChoicesDisplayProps = Omit<BehaviourDisplayProps, "behaviour" | "rows"> & {
  /** One formatted line per choice group, e.g. "Main course: pick 1". */
  groups: readonly string[];
};

/** CHOICES behaviour: the choice groups among the parts. */
export function ChoicesDisplay({ groups, ...rest }: ChoicesDisplayProps) {
  return (
    <BehaviourDisplay behaviour="CHOICES" rows={groups.map((value) => ({ value }))} {...rest} />
  );
}
