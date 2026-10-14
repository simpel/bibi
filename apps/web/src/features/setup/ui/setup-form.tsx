import type { SetupCreateInput, SetupDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { createSetupAction, updateSetupAction } from "../actions";
import { useSetupForm } from "./use-setup-form";

export type SetupFormProps = { setup?: SetupDto | undefined; onDone: () => void };

const save = ({ setup, values }: { setup: SetupDto | undefined; values: SetupCreateInput }) =>
  setup
    ? updateSetupAction({ input: { id: setup.id, ...values } })
    : createSetupAction({ input: values });

/** Create (no `setup`) or edit form: name and changeover time. */
export function SetupForm({ setup, onDone }: SetupFormProps) {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useSetupForm({ setup });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ setup, values }),
    messages: { pending: t("saving"), success: t(setup ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TextField
          form={form}
          name="changeoverMinutes"
          label={t("fields.changeoverMinutes")}
          type="number"
        />
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
