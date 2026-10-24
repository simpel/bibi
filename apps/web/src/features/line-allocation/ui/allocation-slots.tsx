import { useTranslations } from "next-intl";
import { AllocationSlotRow } from "./allocation-slot-row";
import type { LineAllocationsState } from "./use-line-allocations";

export type AllocationSlotsProps = { state: LineAllocationsState; onSaved: () => void };

/** The picker's body: loading, failed, empty, or one row per slot. */
export function AllocationSlots({ state, onSaved }: AllocationSlotsProps) {
  const t = useTranslations("lineAllocation");
  if (state.status === "loading") return <p className="text-sm">{t("loading")}</p>;
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  }
  const { view } = state;
  if (!view || view.slots.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <ul className="grid gap-3">
      {view.slots.map((slot) => (
        <AllocationSlotRow
          key={`${slot.id}:${slot.unitId ?? ""}`}
          {...{ slot, onSaved }}
          startsAt={view.startsAt}
          endsAt={view.endsAt}
        />
      ))}
    </ul>
  );
}
