import { BoardPhaseCreateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createBoardPhaseAction, updateBoardPhaseAction } from "../actions";

type Values = { name: string };

const phaseSchema = formSchema({
  schema: BoardPhaseCreateInputSchema.pick({ name: true }),
  toInput: ({ values }: { values: Values }) => ({ ...values, name: values.name.trim() }),
});

export type PhaseFormProps = {
  boardId: string;
  /** The column to edit; without one, a new column is added at `position`. */
  phase?: { id: string; title: string };
  position?: number;
  onDone: () => void;
};

/** The name of a board column (`boardPhase.create` / `boardPhase.update`). */
export function PhaseForm({ boardId, phase, position, onDone }: PhaseFormProps) {
  const t = useTranslations("boardPhase");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<Values, unknown, Values>({
    resolver: zodResolver(phaseSchema, useZodMessages()),
    defaultValues: { name: phase?.title ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      phase
        ? updateBoardPhaseAction({ input: { id: phase.id, ...values } })
        : createBoardPhaseAction({ input: { boardId, ...values, position, statusIds: [] } }),
    messages: { pending: t("saving"), success: t(phase ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <Button type="submit" size="sm" className="justify-self-end" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
