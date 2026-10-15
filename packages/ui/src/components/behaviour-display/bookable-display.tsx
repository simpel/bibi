import { BehaviourDisplay, type BehaviourDisplayProps } from "./behaviour-display";

export type BookableDisplayProps = Omit<BehaviourDisplayProps, "behaviour" | "rows"> & {
  /** Formatted default booking length, e.g. "90 min"; null = not set. */
  duration: string | null;
};

/** BOOKABLE behaviour: the default booking length. */
export function BookableDisplay({ duration, ...rest }: BookableDisplayProps) {
  return (
    <BehaviourDisplay behaviour="BOOKABLE" rows={duration ? [{ value: duration }] : []} {...rest} />
  );
}
