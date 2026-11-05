"use client";

import { type OrderStatusDto, TRANSITION_GATES } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { setOrderStatusGatesAction } from "../actions";
import { FlowGateRow } from "./flow-gate-row";
import { useFlowGatesForm } from "./use-flow-gates-form";

export type FlowGatesFormProps = {
  /** The status the moves go to. */
  orderStatus: OrderStatusDto;
  /** Every other active status that orders can leave (not the closing ones). */
  sources: readonly OrderStatusDto[];
};

/** What a move into one status requires, written as sentences with a source choice (ADR 0076). */
export function FlowGatesForm({ orderStatus, sources }: FlowGatesFormProps) {
  const t = useTranslations("orderStatus.flow");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useFlowGatesForm({ orderStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setOrderStatusGatesAction({ input: values }),
    messages: { pending: t("saving"), success: t("gatesSaved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {t("requirementsIntro", { name: orderStatus.name })}
        </p>
        {TRANSITION_GATES.map((gate) => (
          <FlowGateRow
            key={gate}
            control={form.control}
            gate={gate}
            orderStatus={orderStatus}
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
