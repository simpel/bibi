import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddStatusForm } from "./add-status-form";
import { FormPopover } from "./form-popover";

export type AddStatusButtonProps = { boardId: string };

/** "+ Add status" in the unphased column (`ticketStatus.create`). */
export function AddStatusButton({ boardId }: AddStatusButtonProps) {
  const t = useTranslations("boardPhase");
  return (
    <FormPopover
      label={t("addStatus")}
      title={t("addStatus")}
      icon={<PlusIcon aria-hidden />}
      variant="ghost"
      className="justify-start"
    >
      {({ close }) => <AddStatusForm boardId={boardId} onDone={close} />}
    </FormPopover>
  );
}
