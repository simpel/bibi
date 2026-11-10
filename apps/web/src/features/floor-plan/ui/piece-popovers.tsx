import { type EffectiveElement, isOpening, type SeatSides } from "@bibi/core/schemas";
import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "@bibi/ui";
import { ArmchairIcon, RulerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { SeatStepper } from "./seat-stepper";

const MAX_SIDE = 20;

export type SizeChange = { widthCm?: number; depthCm?: number } | "reset";

export type SizePopoverProps = {
  effective: EffectiveElement;
  /** The piece has its own size or chairs (Reset shows). */
  overridden: boolean;
  onChange: (change: SizeChange) => void;
};

const toCm = ({ value }: { value: string }) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number >= 10 && number <= 5000 ? number : null;
};

/** Width and depth (diameter for a round piece) in centimetres, and a reset to the library's. */
export function SizePopover({ effective, overridden, onChange }: SizePopoverProps) {
  const t = useTranslations("floorPlan.size");
  const id = useId();
  const round = effective.shape === "ROUND";
  // A door or window has only a width: its depth is the wall's.
  const single = round || isOpening(effective);
  const field = ({ key, value }: { key: "widthCm" | "depthCm"; value: number }) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`${id}-${key}`}>
        {t(round ? "diameter" : key === "widthCm" ? "width" : "depth")}
      </Label>
      <Input
        id={`${id}-${key}`}
        type="number"
        min={10}
        max={5000}
        step={10}
        defaultValue={value}
        onBlur={(event) => {
          const cm = toCm({ value: event.currentTarget.value });
          if (cm !== null && cm !== value) onChange({ [key]: cm });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </div>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("label")}>
          <RulerIcon />
          <span className="tabular-nums">
            {round
              ? t("roundValue", { width: effective.widthCm })
              : single
                ? t("widthValue", { width: effective.widthCm })
                : t("value", { width: effective.widthCm, depth: effective.depthCm })}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="grid w-64 gap-3">
        <div className={single ? "grid" : "grid grid-cols-2 gap-3"}>
          {field({ key: "widthCm", value: effective.widthCm })}
          {single ? null : field({ key: "depthCm", value: effective.depthCm })}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!overridden}
          onClick={() => onChange("reset")}
        >
          {t("reset")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export type ChairsPopoverProps = {
  sides: SeatSides;
  total: number;
  onChange: (sides: Partial<SeatSides>) => void;
};

/** Chairs per side of a rectangular piece, laid out around a picture of the table. */
export function ChairsPopover({ sides, total, onChange }: ChairsPopoverProps) {
  const t = useTranslations("floorPlan.chairs");
  const stepper = ({ side }: { side: keyof SeatSides }) => (
    <SeatStepper
      value={sides[side]}
      max={MAX_SIDE}
      label={t(`sides.${side}`)}
      onChange={(value) => onChange({ [side]: value })}
    />
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("label")}>
          <ArmchairIcon />
          <span className="tabular-nums">{t("count", { count: total })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="mb-3 text-sm text-muted-foreground">{t("hint")}</p>
        <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_3.5rem_auto] items-center justify-items-center gap-1">
          <div className="col-start-2">{stepper({ side: "top" })}</div>
          <div className="row-start-2">{stepper({ side: "left" })}</div>
          <div
            aria-hidden
            className="row-start-2 h-10 w-full rounded-sm border-2 border-foreground bg-card"
          />
          <div className="row-start-2">{stepper({ side: "right" })}</div>
          <div className="col-start-2 row-start-3">{stepper({ side: "bottom" })}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
