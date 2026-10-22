import type { TicketPhaseDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { setTicketPhaseTransitionsAction } from "../actions";
import { TransitionTargetsField } from "./transition-targets-field";
import { useTransitionsForm } from "./use-transitions-form";

export type TransitionsFormProps = {
  phase: TicketPhaseDto;
  /** The phases a ticket could move to (every active phase except `phase`). */
  targets: readonly TicketPhaseDto[];
  onDone: () => void;
};

/** Checkbox list of allowed targets, saved as a set with `ticketPhase.setTransitions`. */
export function TransitionsForm({ phase, targets, onDone }: TransitionsFormProps) {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTransitionsForm({ phase });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setTicketPhaseTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("transitionsSaved") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TransitionTargetsField control={form.control} targets={targets} />
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
