import type { InquiryDto } from "@okazi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useLostForm } from "./use-lost-form";

export type LostDialogProps = {
  inquiry: InquiryDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function LostForm({ inquiry, onDone }: { inquiry: InquiryDto; onDone: () => void }) {
  const common = useTranslations("common");
  const t = useTranslations("inquiry");
  const { form, submit, pending } = useLostForm({ inquiry, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="lossReason"
          label={t("fields.lossReason")}
          multiline
          required
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {t("markLost")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Mark the inquiry as lost (`inquiry.markLost`) with a required reason. */
export function LostDialog({ inquiry, open, onOpenChange }: LostDialogProps) {
  const t = useTranslations("inquiry");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("markLost")}</DialogTitle>
          <DialogDescription>{t("markLostDescription")}</DialogDescription>
        </DialogHeader>
        <LostForm inquiry={inquiry} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
