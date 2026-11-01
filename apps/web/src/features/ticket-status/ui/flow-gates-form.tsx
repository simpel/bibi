"use client";

import { type TicketStatusDto, TRANSITION_GATES } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { setTicketStatusGatesAction } from "../actions";
import { FlowGateRow } from "./flow-gate-row";
import { useFlowGatesForm } from "./use-flow-gates-form";

export type FlowGatesFormProps = {
  /** The status the moves go to. */
  ticketStatus: TicketStatusDto;
  /** Every other active status that tickets can leave (not the closing ones). */
  sources: readonly TicketStatusDto[];
};

/** What a move into one status requires, written as sentences with a source choice (ADR 0076). */
export function FlowGatesForm({ ticketStatus, sources }: FlowGatesFormProps) {
  const t = useTranslations("ticketStatus.flow");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useFlowGatesForm({ ticketStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setTicketStatusGatesAction({ input: values }),
    messages: { pending: t("saving"), success: t("gatesSaved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {t("requirementsIntro", { name: ticketStatus.name })}
        </p>
        {TRANSITION_GATES.map((gate) => (
          <FlowGateRow
            key={gate}
            control={form.control}
            gate={gate}
            ticketStatus={ticketStatus}
            sources={sources}
          />
        ))}
        <Button type="submit" size="sm" className="justify-self-start" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
