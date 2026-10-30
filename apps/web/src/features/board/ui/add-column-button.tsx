import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormPopover } from "./form-popover";
import { PhaseForm } from "./phase-form";

export type AddColumnButtonProps = {
  boardId: string;
  /** Index the new column gets (0 = first). */
  position: number;
  /** Between two columns: a narrow "+" instead of the labelled button after the last column. */
  between?: boolean;
};

/** "Add column" (`boardPhase.create`), between columns or after the last. */
export function AddColumnButton({ boardId, position, between = false }: AddColumnButtonProps) {
  const t = useTranslations("boardPhase");
  return (
    <FormPopover
      label={between ? t("addColumnHere") : t("addColumn")}
      title={t("addColumn")}
      icon={<PlusIcon aria-hidden />}
      iconOnly={between}
      variant={between ? "ghost" : "outline"}
      className={between ? "h-auto w-6 shrink-0 self-stretch px-0" : "shrink-0 self-start"}
    >
      {({ close }) => <PhaseForm boardId={boardId} position={position} onDone={close} />}
    </FormPopover>
  );
}
