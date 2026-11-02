import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import type { IntakeMessage } from "./intake-message";
import type { MessageDraft } from "./message-draft";
import { useMessageRead } from "./use-message-read";

const FORM_ID = "intake-paste-form";

export type PasteDialogProps = {
  /** The inbox message it was opened from: the text starts as its text. */
  message: IntakeMessage | null;
  onRead: (input: { draft: MessageDraft }) => void;
  onClose: () => void;
};

type ActionsProps = { pending: boolean; unavailable: boolean; onClose: () => void };

/** Read the request and Cancel, or only Fill in by hand when reading is unavailable. */
function PasteActions({ pending, unavailable, onClose }: ActionsProps) {
  const t = useTranslations("ticketIntake.message");
  const common = useTranslations("common");
  if (unavailable) {
    return (
      <Button type="button" onClick={onClose}>
        {t("byHand")}
      </Button>
    );
  }
  return (
    <>
      <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
        {common("cancel")}
      </Button>
      <Button type="submit" form={FORM_ID} disabled={pending}>
        {pending ? t("reading") : t("read")}
      </Button>
    </>
  );
}

/**
 * "From a message" (ADR 0084): paste the request, and the assistant's reading prefills the steps
 * without completing them. Opened from an inbox message, the text starts as that message.
 */
export function PasteDialog({ message, onRead, onClose }: PasteDialogProps) {
  const t = useTranslations("ticketIntake.message");
  const { form, submit, pending, unavailable } = useMessageRead({ message, onRead });
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id={FORM_ID} className="grid gap-4" onSubmit={submit} noValidate>
            <TextField form={form} name="text" label={t("text")} multiline rows={10} required />
            {unavailable ? (
              <p className="text-sm text-muted-foreground">{t("unavailable")}</p>
            ) : null}
          </form>
        </Form>
        <DialogFooter>
          <PasteActions pending={pending} unavailable={unavailable} onClose={onClose} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
