import type { RequirementDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { TypeFields } from "@/components/typed-fields/type-fields";
import type { RequirementFormData } from "./requirement-form-data";
import { RequirementTargetFields } from "./requirement-target-fields";
import { useRequirementForm } from "./use-requirement-form";

export type RequirementFormProps = {
  data: RequirementFormData;
  ticketId: string;
  requirement?: RequirementDto | undefined;
  onDone: () => void;
};

/** Create (type, where and which list value first) or edit a count, then the type's fields. */
export function RequirementForm({ requirement, ...props }: RequirementFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("requirement");
  const { form, submit, pending, typeOf } = useRequirementForm({ ...props, requirement });
  const { data, onDone } = props;
  const type = typeOf({ id: form.watch("entityTypeId") });
  const quantity = { form, name: "quantity", type: "number", required: true } as const;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {requirement ? null : <RequirementTargetFields form={form} data={data} typeOf={typeOf} />}
        <TextField {...quantity} label={t("fields.quantity")} />
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
