"use client";

import { type OrderStatusDto, TRANSITION_GATES } from "@bibi/core/schemas";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useSaveOnChange } from "@/lib/use-save-on-change";
import { setOrderStatusGatesAction } from "../actions";
import { FlowGateRow } from "./flow-gate-row";
import { useFlowGatesForm } from "./use-flow-gates-form";

export type FlowGatesFormProps = {
  /** The status the moves go to. */
  orderStatus: OrderStatusDto;
  /** Every other active status that orders can leave (not the closing ones). */
  sources: readonly OrderStatusDto[];
};

/**
 * What a move into one status requires, written as sentences with a source choice (ADR 0076).
 * Each change saves at once.
 */
export function FlowGatesForm({ orderStatus, sources }: FlowGatesFormProps) {
  const t = useTranslations("orderStatus.flow");
  const router = useRouter();
  const form = useFlowGatesForm({ orderStatus });
  const { run } = useFormAction({
    form,
    action: ({ values }) => setOrderStatusGatesAction({ input: values }),
    messages: { pending: t("saving"), success: t("gatesSaved") },
    onSuccess: () => {
      form.reset(form.getValues());
      router.refresh();
    },
    onError: () => form.reset(),
  });
  useSaveOnChange({ form, run });
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid gap-3">
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
      </form>
    </Form>
  );
}
