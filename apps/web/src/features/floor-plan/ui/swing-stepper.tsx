import { Button } from "@bibi/ui";
import { DoorOpenIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const STEP = 15;
const MAX = 180;

export type SwingStepperProps = { value: number; onChange: (swingDeg: number) => void };

/** − 90° + for how far a door or window opens (0 = sliding or a fixed pane). */
export function SwingStepper({ value, onChange }: SwingStepperProps) {
  const t = useTranslations("floorPlan.swing");
  return (
    <fieldset className="m-0 flex items-center gap-0.5 border-0 p-0 pl-1">
      <legend className="sr-only">{t("label")}</legend>
      <DoorOpenIcon className="size-4 text-muted-foreground" aria-hidden />
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t("less")}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - STEP))}
      >
        <MinusIcon />
      </Button>
      <span className="min-w-9 text-center text-sm tabular-nums" aria-live="polite">
        {t("value", { degrees: value })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t("more")}
        disabled={value >= MAX}
        onClick={() => onChange(Math.min(MAX, value + STEP))}
      >
        <PlusIcon />
      </Button>
    </fieldset>
  );
}
