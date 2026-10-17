import type { FieldDefinitionDto } from "@okazi/core";
import { DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMoveField } from "./use-move-field";

export type FieldMoveItemsProps = {
  field: FieldDefinitionDto;
  /** Neighbours in display order; absent at the ends of the list. */
  previous?: FieldDefinitionDto | undefined;
  next?: FieldDefinitionDto | undefined;
};

/** "Move up" and "Move down" menu items; each swaps positions with the neighbour. */
export function FieldMoveItems({ field, previous, next }: FieldMoveItemsProps) {
  const t = useTranslations("fieldDefinition");
  const { pending, move } = useMoveField({ field });
  return (
    <>
      <DropdownMenuItem
        disabled={!previous || pending}
        onSelect={() => previous && move({ other: previous })}
      >
        {t("moveUp")}
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!next || pending} onSelect={() => next && move({ other: next })}>
        {t("moveDown")}
      </DropdownMenuItem>
    </>
  );
}
