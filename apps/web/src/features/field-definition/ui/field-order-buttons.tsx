import type { FieldDefinitionDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { moveFieldAction } from "../actions";

export type FieldOrderButtonsProps = {
  field: FieldDefinitionDto;
  /** Neighbours in display order; absent at the ends of the list. */
  previous?: FieldDefinitionDto | undefined;
  next?: FieldDefinitionDto | undefined;
};

/** Move a field up or down by swapping positions with its neighbour. */
export function FieldOrderButtons({ field, previous, next }: FieldOrderButtonsProps) {
  const t = useTranslations("fieldDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const move = ({ other }: { other: FieldDefinitionDto }) =>
    run({
      action: () => moveFieldAction({ id: field.id, otherId: other.id }),
      messages: { pending: t("reordering"), success: t("updated") },
      onSuccess: () => router.refresh(),
    });
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("moveUp")}
        disabled={!previous || pending}
        onClick={() => previous && move({ other: previous })}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("moveDown")}
        disabled={!next || pending}
        onClick={() => next && move({ other: next })}
      >
        <ArrowDownIcon />
      </Button>
    </>
  );
}
