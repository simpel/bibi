"use client";

import type { QuoteDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import {
  CheckCircleIcon,
  CopyPlusIcon,
  PencilIcon,
  SendIcon,
  TimerOffIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QuoteCommand } from "./quote-command";
import { QuoteDialog } from "./quote-dialog";

export type QuoteAbilities = {
  edit: boolean;
  send: boolean;
  accept: boolean;
  decline: boolean;
  expire: boolean;
  revise: boolean;
};

export type QuoteActionsProps = {
  quote: QuoteDto;
  /** Which commands the state machine and the version rules allow now. */
  can: QuoteAbilities;
};

/** Edit (draft), send, accept, decline, expire and new-version buttons of the quote page. */
export function QuoteActions({ quote, can }: QuoteActionsProps) {
  const t = useTranslations("quote");
  const [editing, setEditing] = useState(false);
  return (
    <>
      {can.send ? (
        <QuoteCommand quote={quote} command="send" icon={<SendIcon />} variant="default" />
      ) : null}
      {can.edit ? (
        <Button variant="outline" onClick={() => setEditing(true)}>
          <PencilIcon />
          {t("edit")}
        </Button>
      ) : null}
      {can.revise ? <QuoteCommand quote={quote} command="revise" icon={<CopyPlusIcon />} /> : null}
      {can.accept ? (
        <QuoteCommand quote={quote} command="accept" icon={<CheckCircleIcon />} variant="default" />
      ) : null}
      {can.decline ? <QuoteCommand quote={quote} command="decline" icon={<XCircleIcon />} /> : null}
      {can.expire ? <QuoteCommand quote={quote} command="expire" icon={<TimerOffIcon />} /> : null}
      <QuoteDialog
        target={{ id: quote.id }}
        quote={quote}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}
