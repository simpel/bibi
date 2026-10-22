import type { ResponsibilityCreateInput, ResponsibilityDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createResponsibilityAction, updateResponsibilityAction } from "../actions";
import { ResponsibilityFormFields } from "./responsibility-form-fields";
import type { ResponsibilityOptions } from "./responsibility-options";
import { useResponsibilityForm } from "./use-responsibility-form";

export type ResponsibilityFormProps = {
  responsibility?: ResponsibilityDto | undefined;
  options: ResponsibilityOptions;
  onDone: () => void;
};

type SaveInput = {
  responsibility: ResponsibilityDto | undefined;
  values: ResponsibilityCreateInput;
};

const save = ({ responsibility, values }: SaveInput) =>
  responsibility
    ? updateResponsibilityAction({ input: { id: responsibility.id, ...values } })
    : createResponsibilityAction({ input: values });

/** Create (no `responsibility`) or edit form: name, covered types, default assignee, followers. */
export function ResponsibilityForm({ responsibility, options, onDone }: ResponsibilityFormProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useResponsibilityForm({ responsibility });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ responsibility, values }),
    messages: { pending: t("saving"), success: t(responsibility ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <ResponsibilityFormFields form={form} options={options} />
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
