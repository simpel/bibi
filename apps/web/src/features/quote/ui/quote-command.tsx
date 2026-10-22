import type { QuoteDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ActionResult } from "@/lib/action-result";
import { useRouter } from "@/lib/navigation";
import { quoteRoute } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import {
  acceptQuoteAction,
  declineQuoteAction,
  expireQuoteAction,
  reviseQuoteAction,
  sendQuoteAction,
} from "../actions";

/** The quote's status and version commands, by their i18n key under `quote`. */
export const QUOTE_COMMANDS = {
  send: { action: sendQuoteAction, done: "sent", confirm: "confirm.send" },
  accept: { action: acceptQuoteAction, done: "accepted", confirm: "confirm.accept" },
  decline: { action: declineQuoteAction, done: "declined", confirm: "confirm.decline" },
  expire: { action: expireQuoteAction, done: "expired", confirm: "confirm.expire" },
  revise: { action: reviseQuoteAction, done: "revised", confirm: null },
} as const satisfies Record<
  string,
  {
    action: (input: { id: string }) => Promise<ActionResult<QuoteDto>>;
    done: string;
    /** The confirmation text's key; null = runs at once. */
    confirm: string | null;
  }
>;

export type QuoteCommandName = keyof typeof QUOTE_COMMANDS;

export type QuoteCommandProps = {
  quote: QuoteDto;
  command: QuoteCommandName;
  icon: ReactNode;
  variant?: "default" | "outline";
};

type UseQuoteCommandInput = { quote: QuoteDto; command: QuoteCommandName; onDone: () => void };

/** Runs the command with one toast; a new version opens its page, otherwise the page reloads. */
function useQuoteCommand({ quote, command, onDone }: UseQuoteCommandInput) {
  const t = useTranslations("quote");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const { action, done } = QUOTE_COMMANDS[command];
  const execute = () =>
    run({
      action: () => action({ id: quote.id }),
      messages: { pending: common("saving"), success: t(done) },
      onSuccess: ({ value }) => {
        onDone();
        if (value.id === quote.id) router.refresh();
        else router.push(quoteRoute({ id: value.id }));
      },
    });
  return { execute, pending };
}

/** One command button; status moves ask for confirmation first (CLAUDE.md "Forms"). */
export function QuoteCommand({ quote, command, icon, variant = "outline" }: QuoteCommandProps) {
  const t = useTranslations("quote");
  const [open, setOpen] = useState(false);
  const { execute, pending } = useQuoteCommand({ quote, command, onDone: () => setOpen(false) });
  const { confirm } = QUOTE_COMMANDS[command];
  return (
    <>
      <Button
        variant={variant}
        disabled={pending}
        onClick={confirm ? () => setOpen(true) : execute}
      >
        {icon}
        {t(command)}
      </Button>
      {confirm ? (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={t(command)}
          description={t(confirm, { version: quote.version })}
          confirmLabel={t(command)}
          pending={pending}
          onConfirm={execute}
        />
      ) : null}
    </>
  );
}
