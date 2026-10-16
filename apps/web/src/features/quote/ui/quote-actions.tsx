"use client";

import type { QuoteDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { CopyPlusIcon, PencilIcon, SendIcon, TimerOffIcon, XCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { QuoteCommand } from "./quote-command";
import { QuoteDialog } from "./quote-dialog";

export type QuoteAbilities = {
  edit: boolean;
  send: boolean;
  decline: boolean;
  expire: boolean;
  revise: boolean;
};

export type QuoteActionsProps = {
  quote: QuoteDto;
  items: readonly NamedOption[];
  /** Which commands the state machine and the version rules allow now. */
  can: QuoteAbilities;
};

/** Edit (draft), send, decline, expire and new-version buttons of the quote page. */
export function QuoteActions({ quote, items, can }: QuoteActionsProps) {
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
      {can.decline ? <QuoteCommand quote={quote} command="decline" icon={<XCircleIcon />} /> : null}
      {can.expire ? <QuoteCommand quote={quote} command="expire" icon={<TimerOffIcon />} /> : null}
      <QuoteDialog
        target={{ id: quote.id }}
        quote={quote}
        items={items}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}
