import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToastAction } from "@/lib/use-toast-action";
import { assignLineAllocationAction } from "../actions";
import { NO_UNIT } from "./unit-select";

export type UseAssignUnitInput = { allocationId: string; onSaved: () => void };

/** Saves one slot's unit in the one-toast flow; a refused unit (CONFLICT) is also kept for the row. */
export function useAssignUnit({ allocationId, onSaved }: UseAssignUnitInput) {
  const t = useTranslations("lineAllocation");
  const { pending, run } = useToastAction();
  const [conflict, setConflict] = useState(false);
  const save = ({ value }: { value: string }) => {
    setConflict(false);
    run({
      action: async () => {
        const result = await assignLineAllocationAction({
          input: { id: allocationId, unitId: value === NO_UNIT ? null : value },
        });
        if (!result.ok && result.error.code === "CONFLICT") setConflict(true);
        return result;
      },
      messages: { pending: t("saving"), success: t("saved") },
      onSuccess: onSaved,
    });
  };
  return { pending, conflict, save };
}
