"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { Form, FormControl, FormController, FormItem, FormLabel, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useSaveOnChange } from "@/lib/use-save-on-change";
import { setOrderStatusTransitionsAction } from "../actions";
import { FlowTargetsField } from "./flow-targets-field";
import { useFlowMovesForm } from "./use-flow-moves-form";

export type FlowMovesFormProps = {
  orderStatus: OrderStatusDto;
  /** Every other active status an order could move to. */
  targets: readonly OrderStatusDto[];
};

/**
 * "Orders in New can move to: any status / only these" (ADR 0076). A status that closes orders
 * has no moves out, so it shows a sentence and no form. Each change saves at once; "only these"
 * with nothing picked yet waits for the first pick.
 */
export function FlowMovesForm({ orderStatus, targets }: FlowMovesFormProps) {
  const t = useTranslations("orderStatus.flow");
  const router = useRouter();
  const form = useFlowMovesForm({ orderStatus });
  const { run } = useFormAction({
    form,
    action: ({ values }) => setOrderStatusTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("movesSaved") },
    onSuccess: () => {
      form.reset(form.getValues());
      router.refresh();
    },
    onError: () => form.reset(),
  });
  useSaveOnChange({
    form,
    run,
    ready: ({ values }) => !values.onlyThese || values.toStatusIds.length > 0,
  });
  const { name } = orderStatus;
  if (orderStatus.closes) return <p className="text-sm text-muted-foreground">{t("closing")}</p>;
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid gap-3">
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
      </form>
    </Form>
  );
}
