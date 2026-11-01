"use client";

import type { TicketStatusDto } from "@bibi/core/schemas";
import { Button, Form, FormControl, FormController, FormItem, FormLabel, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { setTicketStatusTransitionsAction } from "../actions";
import { FlowTargetsField } from "./flow-targets-field";
import { useFlowMovesForm } from "./use-flow-moves-form";

export type FlowMovesFormProps = {
  ticketStatus: TicketStatusDto;
  /** Every other active status a ticket could move to. */
  targets: readonly TicketStatusDto[];
};

/**
 * "Tickets in New can move to: any status / only these" (ADR 0076). A status that closes tickets
 * has no moves out, so it shows a sentence and no form.
 */
export function FlowMovesForm({ ticketStatus, targets }: FlowMovesFormProps) {
  const t = useTranslations("ticketStatus.flow");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useFlowMovesForm({ ticketStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setTicketStatusTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("movesSaved") },
    onSuccess: () => router.refresh(),
  });
  const { name } = ticketStatus;
  if (ticketStatus.closes) return <p className="text-sm text-muted-foreground">{t("closing")}</p>;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <FormController
          control={form.control}
          name="onlyThese"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>
                {field.value ? t("movesOnly", { name }) : t("movesAny", { name })}
              </FormLabel>
            </FormItem>
          )}
        />
        {form.watch("onlyThese") ? (
          <FlowTargetsField control={form.control} name={name} targets={targets} />
        ) : null}
        <Button type="submit" size="sm" className="justify-self-start" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
