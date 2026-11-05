"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { Button, Form, FormControl, FormController, FormItem, FormLabel, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
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
 * has no moves out, so it shows a sentence and no form.
 */
export function FlowMovesForm({ orderStatus, targets }: FlowMovesFormProps) {
  const t = useTranslations("orderStatus.flow");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useFlowMovesForm({ orderStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setOrderStatusTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("movesSaved") },
    onSuccess: () => router.refresh(),
  });
  const { name } = orderStatus;
  if (orderStatus.closes) return <p className="text-sm text-muted-foreground">{t("closing")}</p>;
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
