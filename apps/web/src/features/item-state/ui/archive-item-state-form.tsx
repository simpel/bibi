import { zodResolver } from "@hookform/resolvers/zod";
import type { ItemStateDto } from "@okazi/core/schemas";
import { ItemStateArchiveInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveItemStateAction } from "../actions";

type Values = { targetStateId: string };
type Output = z.infer<typeof ItemStateArchiveInputSchema>;

const schemaFor = ({ id }: { id: string }) =>
  formSchema({
    schema: ItemStateArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetStateId && values.targetStateId !== NONE
        ? { targetStateId: values.targetStateId }
        : {}),
    }),
  });

export type ArchiveItemStateFormProps = {
  state: ItemStateDto;
  targets: readonly ItemStateDto[];
  onDone: () => void;
};

/** Archive a state; its lines move to the chosen state of the same type. */
export function ArchiveItemStateForm({ state, targets, onDone }: ArchiveItemStateFormProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schemaFor({ id: state.id }), useZodMessages()),
    defaultValues: { targetStateId: NONE },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveItemStateAction({ input: values }),
    messages: { pending: t("archiving"), success: t("archived") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="targetStateId"
          label={t("fields.targetState")}
          options={targets.map(({ id, name }) => ({ id, name }))}
          noneLabel={t("noTarget")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {t("archive")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
