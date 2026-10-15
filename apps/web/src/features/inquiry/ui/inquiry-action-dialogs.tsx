import type { InquiryDto } from "@okazi/core";
import { InquiryDialog } from "./inquiry-dialog";
import type { InquiryFormData } from "./inquiry-form-data";
import { LostDialog } from "./lost-dialog";
import { OwnerDialog } from "./owner-dialog";

export type InquiryActionDialog = "edit" | "assign" | "qualify" | "lost" | null;

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
      <InquiryDialog {...shared} data={data} open={dialog === "edit"} />
      <OwnerDialog {...shared} mode="qualify" members={data.members} open={dialog === "qualify"} />
      <OwnerDialog {...shared} mode="assign" members={data.members} open={dialog === "assign"} />
      <LostDialog {...shared} open={dialog === "lost"} />
    </>
  );
}
