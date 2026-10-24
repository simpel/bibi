import type { TicketStatusDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { setTicketStatusTransitionsAction } from "../actions";
import { TransitionTargetsField } from "./transition-targets-field";
import { useTransitionsForm } from "./use-transitions-form";

export type TransitionsFormProps = {
  ticketStatus: TicketStatusDto;
  /** The statuses a ticket could move to (every active status except `status`). */
  targets: readonly TicketStatusDto[];
  onDone: () => void;
};

/** Checkbox list of allowed targets, saved as a set with `ticketStatus.setTransitions`. */
export function TransitionsForm({ ticketStatus, targets, onDone }: TransitionsFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTransitionsForm({ ticketStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setTicketStatusTransitionsAction({ input: values }),
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
