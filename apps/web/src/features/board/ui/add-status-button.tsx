import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddStatusForm } from "./add-status-form";
import { FormPopover } from "./form-popover";

/** "+ Add status" in the unphased column (`ticketStatus.create`). */
export function AddStatusButton() {
  const t = useTranslations("boardPhase");
  return (
    <FormPopover
      label={t("addStatus")}
      title={t("addStatus")}
      icon={<PlusIcon aria-hidden />}
      variant="ghost"
      className="justify-start"
    >
      {({ close }) => <AddStatusForm onDone={close} />}
    </FormPopover>
  );
}
