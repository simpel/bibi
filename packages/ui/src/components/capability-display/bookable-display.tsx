import { CapabilityDisplay, type CapabilityDisplayProps } from "./capability-display";

export type BookableDisplayProps = Omit<CapabilityDisplayProps, "capability" | "rows"> & {
  /** Formatted default booking length, e.g. "90 min"; null = not set. */
  duration: string | null;
};

/** BOOKABLE capability: the default booking length. */
export function BookableDisplay({
  duration,
  variant,
  density,
  className,
  ...rest
}: BookableDisplayProps) {
  if (!duration) return null;
  const isPlain = variant === "plain";
  return (
    <CapabilityDisplay
      capability="BOOKABLE"
      variant={variant}
      density={density}
      className={className}
      {...rest}
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={
            isPlain
              ? "font-sans text-base font-medium tracking-tight text-foreground tabular-nums"
              : "font-sans text-2xl font-medium tracking-tight text-foreground tabular-nums sm:text-3xl"
          }
        >
          {duration}
        </span>
      </div>
    </CapabilityDisplay>
  );
}
