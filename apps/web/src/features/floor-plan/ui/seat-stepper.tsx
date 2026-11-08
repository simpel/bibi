import { Button } from "@bibi/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type SeatStepperProps = {
  value: number;
  max: number;
  /** What the count is, for screen readers, e.g. "Chairs on the top side". */
  label: string;
  onChange: (value: number) => void;
};

/** − n + for a number of chairs. */
export function SeatStepper({ value, max, label, onChange }: SeatStepperProps) {
  const t = useTranslations("floorPlan.chairs");
  return (
    <fieldset className="m-0 flex items-center gap-0.5 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t("fewer")}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <span className="min-w-6 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t("more")}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </fieldset>
  );
}
