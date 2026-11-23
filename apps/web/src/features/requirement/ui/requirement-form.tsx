import type { RequirementDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { TypeFields } from "@/components/typed-fields/type-fields";
import type { RequirementFormData } from "./requirement-form-data";
import { RequirementSetupNotice } from "./requirement-setup-notice";
import { RequirementTargetFields } from "./requirement-target-fields";
import { useRequirementForm } from "./use-requirement-form";

export type RequirementFormProps = {
  data: RequirementFormData;
  orderId: string;
  requirement?: RequirementDto | undefined;
  onDone: () => void;
};

/** What the organization lacks before a count can be created, if anything. */
const missingSetup = ({ data }: { data: RequirementFormData }) => {
  if (!data.types.some((type) => type.status === "ACTIVE")) return "type";
  return data.lists.length === 0 ? "list" : null;
};

/** Create (list value, where and type first) or edit a count, then the type's fields. */
export function RequirementForm({ requirement, ...props }: RequirementFormProps) {
  const missing = requirement ? null : missingSetup({ data: props.data });
  if (missing === null) return <RequirementFields {...props} requirement={requirement} />;
  return (
    <RequirementSetupNotice
      missing={missing}
      canSetUp={props.data.canSetUp}
      onDone={props.onDone}
    />
  );
}

function RequirementFields({ requirement, ...props }: RequirementFormProps) {
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
