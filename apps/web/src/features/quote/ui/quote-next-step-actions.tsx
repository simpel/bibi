"use client";

import type { QuoteDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { CheckIcon, RotateCcwIcon, SendIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { QuoteAbilities } from "./quote-abilities";
import { QUIET_LINK, QuoteCommand } from "./quote-command";
import { QuoteDialog } from "./quote-dialog";
import { RestoreQuoteVersion } from "./restore-quote-version";

export type QuoteNextStepActionsProps = { quote: QuoteDto; can: QuoteAbilities };

/** The answers to the card's question, as buttons; what the quote's status allows now. */
function Answers({ quote, can }: QuoteNextStepActionsProps) {
  const t = useTranslations("quote.nextStep");
  const superseded = quote.quoteStatus === "SUPERSEDED";
  return (
    <div className="flex flex-wrap gap-2">
      {can.send ? (
        <QuoteCommand quote={quote} command="send" icon={<SendIcon />} variant="default" />
      ) : null}
      {can.reopen ? (
        <QuoteCommand quote={quote} command="reopen" icon={<RotateCcwIcon />} variant="default" />
      ) : null}
      {can.accept ? (
        <QuoteCommand
          quote={quote}
          command={superseded ? "choose" : "accept"}
          icon={<CheckIcon />}
          label={superseded ? undefined : t("accepted")}
          variant={superseded ? "outline" : "default"}
        />
      ) : null}
      {can.decline && !superseded ? (
        <QuoteCommand quote={quote} command="decline" icon={<XIcon />} label={t("declined")} />
      ) : null}
    </div>
  );
}

/**
 * The next-step card's buttons: the answers to its question, then the rare commands as quiet
 * links (edit, new version, restore, decline a replaced version, expire).
 */
export function QuoteNextStepActions({ quote, can }: QuoteNextStepActionsProps) {
  const t = useTranslations("quote");
  const [editing, setEditing] = useState(false);
  const superseded = quote.quoteStatus === "SUPERSEDED";
  const quiet = [
    can.edit ? (
      <Button key="edit" variant="link" className={QUIET_LINK} onClick={() => setEditing(true)}>
        {t("edit")}
      </Button>
    ) : null,
    can.revise ? <QuoteCommand key="revise" quote={quote} command="revise" variant="link" /> : null,
    can.restore && quote.versionId ? (
      <RestoreQuoteVersion key="restore" versionId={quote.versionId} quoteVersion={quote.version} />
    ) : null,
    can.decline && superseded ? (
      <QuoteCommand key="decline" quote={quote} command="decline" variant="link" />
    ) : null,
    can.expire ? <QuoteCommand key="expire" quote={quote} command="expire" variant="link" /> : null,
  ].filter(Boolean);
  return (
    <div className="grid gap-4">
      <Answers quote={quote} can={can} />
      {quiet.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">{quiet}</div>
      ) : null}
      {can.edit ? (
        <QuoteDialog
          target={{ id: quote.id }}
          quote={quote}
          open={editing}
          onOpenChange={setEditing}
        />
      ) : null}
    </div>
  );
}
