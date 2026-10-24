import type { ItemDemandDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { PoolOption } from "./demand-types";
import { DemandWindowsField } from "./demand-windows-field";
import { useDemandForm } from "./use-demand-form";

export type DemandFormProps = {
  itemId: string;
  /** The pools offered when creating. */
  pools: readonly PoolOption[];
  /** Present = edit mode (the target is fixed), absent = create mode. */
  demand?: ItemDemandDto | undefined;
  onDone: () => void;
};

/** Create or edit a demand: target pool, mandatory or optional, quantity and windows. */
export function DemandForm({ itemId, pools, demand, onDone }: DemandFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("itemDemand.fields");
  const { form, submit, pending } = useDemandForm({ itemId, demand, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {demand ? null : (
          <OptionSelectField
            control={form.control}
            name="entityTypeId"
            label={t("pool")}
            options={pools}
          />
        )}
        <TextField form={form} name="quantity" label={t("quantity")} type="number" required />
        <CheckField form={form} name="required" label={t("required")} />
        <DemandWindowsField control={form.control} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
