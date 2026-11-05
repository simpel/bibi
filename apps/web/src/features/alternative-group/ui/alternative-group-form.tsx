import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createAlternativeGroupAction } from "../actions";
import { LineOptionsField } from "./line-options-field";
import type { OptionLine } from "./option-line";
import { useAlternativeGroupForm } from "./use-alternative-group-form";

export type AlternativeGroupFormProps = {
  orderId: string;
  lines: OptionLine[];
  onDone: () => void;
};

/** Create form: a name and two or more of the order's lines as the options. */
export function AlternativeGroupForm({ orderId, lines, onDone }: AlternativeGroupFormProps) {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useAlternativeGroupForm({ orderId });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createAlternativeGroupAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <LineOptionsField form={form} lines={lines} label={t("fields.lineIds")} />
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
