import type { LineDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { ProgramCoreFields } from "./program-core-fields";
import type { ProgramFormData } from "./program-form-data";
import { useLineForm } from "./use-line-form";

export type LineFormProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
  line?: LineDto | undefined;
  onDone: () => void;
};

/** Create (type first) or edit a line, then the type's fields. */
export function LineForm({ line, ...props }: LineFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("line");
  const { form, submit, pending, typeOf } = useLineForm({ ...props, line });
  const { data, onDone } = props;
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {line ? null : (
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
