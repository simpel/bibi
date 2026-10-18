import type { InquiryDto } from "@okazi/core";
import type { InquiryFormData } from "./inquiry-form-data";
import { LostDialog } from "./lost-dialog";
import { QualifyDialog } from "./qualify-dialog";

export type InquiryActionDialog = "qualify" | "lost" | null;

export type InquiryActionDialogsProps = {
  inquiry: InquiryDto;
  data: InquiryFormData;
  dialog: InquiryActionDialog;
  onClose: () => void;
};

/** The dialogs behind the inquiry detail buttons; `dialog` says which one is open. */
export function InquiryActionDialogs({
  inquiry,
  data,
  dialog,
  onClose,
}: InquiryActionDialogsProps) {
  const shared = {
    inquiry,
    onOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
  };
  return (
    <>
      <QualifyDialog {...shared} members={data.members} open={dialog === "qualify"} />
      <LostDialog {...shared} open={dialog === "lost"} />
    </>
  );
}
