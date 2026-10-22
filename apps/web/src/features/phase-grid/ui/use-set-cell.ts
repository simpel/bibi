import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setPhaseGridCellAction } from "../actions";

/** Select value standing for the empty cell (a Select item cannot have an empty value). */
export const KEEP = "keep";

export type UseSetCellInput = { phaseId: string; entityTypeId: string };

/** Saves one cell (`phaseGrid.setCell`) in the one-toast flow; `KEEP` clears it. */
export function useSetCell({ phaseId, entityTypeId }: UseSetCellInput) {
  const t = useTranslations("phaseGrid");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const change = ({ value }: { value: string }) =>
    run({
      action: () =>
        setPhaseGridCellAction({
          input: { phaseId, entityTypeId, stateId: value === KEEP ? null : value },
        }),
      messages: { pending: t("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
    });
  return { pending, change };
}
