import type { TicketDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createTicketAction, updateTicketAction } from "../actions";
import type { TicketFormData } from "./ticket-form-data";
import { type TicketFormOutput, ticketFormSchema, toTicketUpdate } from "./ticket-form-schema";
import { type TicketFormValues, ticketFormDefaults } from "./ticket-form-values";

export type UseTicketFormInput = {
  data: TicketFormData;
  /** Present = edit mode, absent = create mode. */
  ticket?: TicketDto | undefined;
  onDone: () => void;
};

/** Ticket form state; a new ticket opens its page, an edit refreshes it. */
export function useTicketForm({ data, ticket, onDone }: UseTicketFormInput) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<TicketFormValues, TicketFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => ticketFormSchema({ type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: ticket?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<TicketFormValues, unknown, TicketFormOutput>({
    resolver,
    defaultValues: ticketFormDefaults({ type: initial, ticket }),
  });
  const { submit, run, pending } = useFormAction({
    form,
    action: ({ values }) =>
      ticket
        ? updateTicketAction({
            input: toTicketUpdate({ ticket, values, type: typeOf({ id: ticket.entityTypeId }) }),
          })
        : createTicketAction({ input: values }),
    messages: { pending: common("saving"), success: t(ticket ? "updated" : "created") },
    onSuccess: ({ value }) => {
      onDone();
      if (ticket) router.refresh();
      else router.push(ticketRoute({ id: value.id }));
    },
  });
  return { form, submit, run, pending, typeOf };
}
