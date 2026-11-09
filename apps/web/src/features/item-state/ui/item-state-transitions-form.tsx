import type { ItemStateDto } from "@bibi/core/schemas";
import { ItemStateSetTransitionsInputSchema } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useSaveOnChange } from "@/lib/use-save-on-change";
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

/** Checkbox list of allowed targets, saved as a set with `itemState.setTransitions` on each change. */
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
  const { run } = useFormAction({
    form,
    action: ({ values }) => setItemStateTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("transitionsSaved") },
    onSuccess: () => {
      form.reset(form.getValues());
      router.refresh();
    },
    onError: () => form.reset(),
  });
  useSaveOnChange({ form, run });
  const choices = state.released ? [] : targets;
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid gap-4">
        <TransitionChoices control={form.control} choices={choices} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("close")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
