import type { AlternativeGroupDto, AlternativeGroupUpdateInput } from "@bibi/core/schemas";
import { AlternativeGroupUpdateInputSchema } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateAlternativeGroupAction } from "../actions";

export type RenameAlternativeGroupFormProps = { group: AlternativeGroupDto; onDone: () => void };

type RenameValues = { id: string; name: string };

const renameSchema = formSchema({
  schema: AlternativeGroupUpdateInputSchema,
  toInput: ({ values }: { values: RenameValues }) => ({ id: values.id, name: values.name.trim() }),
});

/** The group's new name. */
export function RenameAlternativeGroupForm({ group, onDone }: RenameAlternativeGroupFormProps) {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<RenameValues, unknown, AlternativeGroupUpdateInput>({
    resolver: zodResolver(renameSchema, useZodMessages()),
    defaultValues: { id: group.id, name: group.name },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateAlternativeGroupAction({ input: values }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
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
