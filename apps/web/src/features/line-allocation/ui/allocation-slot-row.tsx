import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { AllocationSlot } from "./allocation-types";
import { NO_UNIT, UnitSelect } from "./unit-select";
import { useAssignUnit } from "./use-assign-unit";

export type AllocationSlotRowProps = {
  slot: AllocationSlot;
  startsAt: Date;
  endsAt: Date;
  onSaved: () => void;
};

type NoneFreeProps = Pick<AllocationSlotRowProps, "slot" | "startsAt" | "endsAt">;

/** Names the pool and the window nobody is free in. */
function NoneFree({ slot, startsAt, endsAt }: NoneFreeProps) {
  const t = useTranslations("lineAllocation");
  const format = useDateTimeFormat();
  const window = format.dateTimeRange({ start: startsAt, end: endsAt });
  return (
    <p role="alert" className="text-sm text-destructive">
      {t("noneFree", { pool: slot.poolName, window })}
    </p>
  );
}

/** One slot: the pool, the unit chosen (prepicked when still empty) and a save. */
export function AllocationSlotRow({ slot, startsAt, endsAt, onSaved }: AllocationSlotRowProps) {
  const t = useTranslations("lineAllocation");
  const [value, setValue] = useState(
    slot.unitId ?? slot.prepickId ?? (slot.required ? "" : NO_UNIT),
  );
  const { pending, conflict, save } = useAssignUnit({ allocationId: slot.id, onSaved });
  const none = slot.options.length === 0;
  const dirty = value !== "" && value !== (slot.unitId ?? NO_UNIT);
  return (
    <li className="grid gap-2 rounded-md border p-3">
      <div className="text-sm font-medium">
        {slot.poolName}
        <span className="ml-2 font-normal text-muted-foreground">
          {t(slot.required ? "mandatory" : "optional")}
          {slot.chained ? ` · ${t("chained")}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <UnitSelect
          options={slot.options}
          value={value}
          canClear={!slot.required}
          disabled={pending || none}
          onChange={setValue}
        />
        <Button disabled={!dirty || pending} onClick={() => save({ value })}>
          {t("save")}
        </Button>
      </div>
      {none || conflict ? <NoneFree {...{ slot, startsAt, endsAt }} /> : null}
    </li>
  );
}
