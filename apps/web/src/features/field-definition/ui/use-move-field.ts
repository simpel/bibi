import type { FieldDefinitionDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { moveFieldAction } from "../actions";

export type UseMoveFieldInput = { field: FieldDefinitionDto };

/** Move a field up or down by swapping positions with its neighbour (`other`). */
export function useMoveField({ field }: UseMoveFieldInput) {
  const t = useTranslations("fieldDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const move = ({ other }: { other: FieldDefinitionDto }) =>
    run({
      action: () => moveFieldAction({ id: field.id, otherId: other.id }),
      messages: { pending: t("reordering"), success: t("updated") },
      onSuccess: () => router.refresh(),
    });
  return { pending, move };
}
