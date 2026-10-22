import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/action-result";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { sendDepositAction, voidDepositAction } from "../../deposit/actions";
import { sendInvoiceAction, voidInvoiceAction } from "../../invoice/actions";

type Lifecycle = (input: { id: string }) => Promise<ActionResult<unknown>>;

export type ReceivableKind = "deposit" | "invoice";

const ACTIONS: Record<ReceivableKind, { send: Lifecycle; void: Lifecycle }> = {
  deposit: { send: sendDepositAction, void: voidDepositAction },
  invoice: { send: sendInvoiceAction, void: voidInvoiceAction },
};

export type UseReceivableMoveInput = { kind: ReceivableKind; id: string; onDone: () => void };

/** Marks a deposit request or an invoice as sent, or voids it, with one toast each. */
export function useReceivableMove({ kind, id, onDone }: UseReceivableMoveInput) {
  const t = useTranslations(kind);
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const move = ({ to }: { to: "send" | "void" }) =>
    run({
      action: () => ACTIONS[kind][to]({ id }),
      messages: { pending: common("saving"), success: t(to === "send" ? "sent" : "voided") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  return { move, pending };
}
