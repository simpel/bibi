import type { ItemStateDto } from "@bibi/core/schemas";
import { ItemStateSetTransitionsInputSchema } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { setItemStateTransitionsAction } from "../actions";
import type { TransitionValues } from "./transition-choices";
import { TransitionChoices } from "./transition-choices";

type Output = z.infer<typeof ItemStateSetTransitionsInputSchema>;

const schemaFor = ({ id }: { id: string }) =>
  formSchema({
    schema: ItemStateSetTransitionsInputSchema,
    toInput: ({ values }: { values: TransitionValues }) => ({ id, toStateIds: values.toStateIds }),
  });

export type ItemStateTransitionsFormProps = {
  state: ItemStateDto;
  targets: readonly ItemStateDto[];
  onDone: () => void;
};

/** Checkbox list of allowed targets, saved as a set with `itemState.setTransitions`. */
export function ItemStateTransitionsForm({
  state,
  targets,
  onDone,
}: ItemStateTransitionsFormProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<TransitionValues, unknown, Output>({
    resolver: zodResolver(schemaFor({ id: state.id }), useZodMessages()),
    defaultValues: { toStateIds: [...state.transitionsTo] },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setItemStateTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("transitionsSaved") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const choices = state.released ? [] : targets;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TransitionChoices control={form.control} choices={choices} />
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
