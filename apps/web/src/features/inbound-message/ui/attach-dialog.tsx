"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { attachMessageAction } from "../actions";
import {
  type AttachFormOutput,
  type AttachFormValues,
  attachFormSchema,
} from "./attach-form-schema";

export type AttachDialogProps = {
  messageId: string;
  /** Recent active tickets, labelled by title (or reference) and customer. */
  tickets: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AttachFormProps = Pick<AttachDialogProps, "messageId" | "tickets"> & { onDone: () => void };

function AttachForm({ messageId, tickets, onDone }: AttachFormProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<AttachFormValues, unknown, AttachFormOutput>({
    resolver: zodResolver(attachFormSchema({ id: messageId }), useZodMessages()),
    defaultValues: { ticketId: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => attachMessageAction({ input: values }),
    messages: { pending: common("saving"), success: t("attached") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="ticketId"
          label={t("ticket")}
          options={tickets}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("attach")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Attach an inbox message to an existing ticket, once (`inboundMessage.attachToTicket`). */
export function AttachDialog({ messageId, tickets, open, onOpenChange }: AttachDialogProps) {
  const t = useTranslations("inbox");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("attachTitle")}</DialogTitle>
          <DialogDescription>{t("attachDescription")}</DialogDescription>
        </DialogHeader>
        <AttachForm messageId={messageId} tickets={tickets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
