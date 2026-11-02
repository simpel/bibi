import {
  type TicketDraftFromMessageInput,
  TicketDraftFromMessageInputSchema,
} from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formSchema } from "@/lib/form-schema";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import { draftFromMessageAction } from "../draft-actions";
import { applyMessageDraft } from "./apply-message-draft";
import type { IntakeMessage } from "./intake-message";
import type { DraftDisplay, MessageDraft } from "./message-draft";

export type MessageFormValues = { text: string };

const messageFormSchema = formSchema({
  schema: TicketDraftFromMessageInputSchema,
  toInput: ({ values }: { values: MessageFormValues }) => ({ text: values.text }),
});

/** The day and times as the user reads them, in the organization's zone. */
function useDraftDisplay(): DraftDisplay {
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  return {
    timeZone,
    day: ({ iso }) => {
      const instant = fromLocalInputValue({ value: `${iso}T12:00`, timeZone });
      return instant ? dates.date({ instant }) : iso;
    },
    time: ({ instant }) => dates.time({ instant }),
  };
}

export type UseMessageReadInput = {
  message: IntakeMessage | null;
  onRead: (input: { draft: MessageDraft }) => void;
};

/**
 * The paste dialog's form: "Read the request" runs `ticketDraft.fromMessage` (ADR 0084). An inbox
 * message left as it came is read by id, so its sender and form fields count as given; edited
 * text is read as pasted. UNAVAILABLE says so, and the dialog offers to fill in by hand.
 */
export function useMessageRead({ message, onRead }: UseMessageReadInput) {
  const t = useTranslations("ticketIntake.message");
  const display = useDraftDisplay();
  const [unavailable, setUnavailable] = useState(false);
  const form = useForm<MessageFormValues, unknown, TicketDraftFromMessageInput>({
    resolver: zodResolver(messageFormSchema, useZodMessages()),
    defaultValues: { text: message?.text ?? "" },
  });
  const asInput = ({ text }: { text: string }): TicketDraftFromMessageInput =>
    message && text === message.text.trim() ? { inboundMessageId: message.id } : { text };
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => draftFromMessageAction({ input: asInput({ text: values.text ?? "" }) }),
    messages: { pending: t("reading"), success: t("readDone") },
    onSuccess: ({ value }) =>
      onRead({ draft: applyMessageDraft({ result: value, display, needsLabel: t("needs") }) }),
    onError: ({ error }) => setUnavailable(error.code === "UNAVAILABLE"),
  });
  return { form, submit, pending, unavailable };
}
