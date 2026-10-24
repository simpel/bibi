import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setStatusGridCellAction } from "../actions";

/** Select value standing for the empty cell (a Select item cannot have an empty value). */
export const KEEP = "keep";

export type UseSetCellInput = { statusId: string; entityTypeId: string };

/** Saves one cell (`statusGrid.setCell`) in the one-toast flow; `KEEP` clears it. */
export function useSetCell({ statusId, entityTypeId }: UseSetCellInput) {
  const t = useTranslations("statusGrid");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const change = ({ value }: { value: string }) =>
    run({
      action: () =>
        setStatusGridCellAction({
          input: { statusId, entityTypeId, stateId: value === KEEP ? null : value },
        }),
      messages: { pending: t("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
    });
  return { pending, change };
}
