import type { WorkOrderDefinitionCreateInput, WorkOrderDefinitionDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createWorkOrderDefinitionAction, updateWorkOrderDefinitionAction } from "../actions";
import { useWorkOrderDefinitionForm } from "./use-work-order-definition-form";
import { WorkOrderDefinitionFormFields } from "./work-order-definition-form-fields";
import type { WorkOrderOptions } from "./work-order-options";

export type WorkOrderDefinitionFormProps = {
  workOrder?: WorkOrderDefinitionDto | undefined;
  options: WorkOrderOptions;
  onDone: () => void;
};

type SaveInput = {
  workOrder: WorkOrderDefinitionDto | undefined;
  values: WorkOrderDefinitionCreateInput;
};

const save = ({ workOrder, values }: SaveInput) =>
  workOrder
    ? updateWorkOrderDefinitionAction({ input: { id: workOrder.id, ...values } })
    : createWorkOrderDefinitionAction({ input: values });

/** Create (no `workOrder`) or edit form: name, included types, fields and lists, receiving role. */
export function WorkOrderDefinitionForm({
  workOrder,
  options,
  onDone,
}: WorkOrderDefinitionFormProps) {
  const t = useTranslations("workOrderDefinition");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useWorkOrderDefinitionForm({ workOrder });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ workOrder, values }),
    messages: { pending: t("saving"), success: t(workOrder ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <WorkOrderDefinitionFormFields form={form} options={options} />
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
