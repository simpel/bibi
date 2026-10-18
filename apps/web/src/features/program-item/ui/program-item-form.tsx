import type { ProgramItemDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { ProgramCoreFields } from "./program-core-fields";
import type { ProgramFormData } from "./program-form-data";
import { useProgramItemForm } from "./use-program-item-form";

export type ProgramItemFormProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
  programItem?: ProgramItemDto | undefined;
  onDone: () => void;
};

/** Create (type first) or edit a program item, then the type's fields. */
export function ProgramItemForm({ programItem, ...props }: ProgramItemFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("programItem");
  const { form, submit, pending, typeOf } = useProgramItemForm({ ...props, programItem });
  const { data, onDone } = props;
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {programItem ? null : (
          <TypeSelectField
            control={form.control}
            types={data.types}
            label={t("fields.type")}
            onTypeChange={(id) =>
              form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
            }
          />
        )}
        {type ? <ProgramCoreFields form={form} data={data} /> : null}
        {type ? <TypeFields control={form.control} type={type} data={data} /> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !type}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
