"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { ticketFromMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import { AttachDialog } from "./attach-dialog";
import { useDismissMessage } from "./use-dismiss-message";

export type MessageActionsProps = {
  id: string;
  dismissed: boolean;
  /** `ticket:write`: new ticket from the message, or attach it to one. */
  canTicket: boolean;
  /** `inbox:write`: dismiss and restore, and attach. */
  canWrite: boolean;
  tickets: readonly NamedOption[];
};

/** What staff do with an inbox message (ADR 0085): a new ticket, attach, dismiss or restore. */
export function MessageActions({
  id,
  dismissed,
  canTicket,
  canWrite,
  tickets,
}: MessageActionsProps) {
  const t = useTranslations("inbox");
  const [attaching, setAttaching] = useState(false);
  const { toggle, pending } = useDismissMessage();
  return (
    <div className="flex flex-wrap gap-2">
      {canTicket && !dismissed ? (
        <Button asChild>
          <Link href={ticketFromMessageRoute({ id })}>{t("newTicket")}</Link>
        </Button>
      ) : null}
      {canTicket && canWrite && !dismissed ? (
        <Button variant="outline" onClick={() => setAttaching(true)}>
          {t("attachTitle")}
        </Button>
      ) : null}
      {canWrite ? (
        <Button variant="outline" disabled={pending} onClick={() => toggle({ id, dismissed })}>
          {dismissed ? t("restore") : t("dismiss")}
        </Button>
      ) : null}
      <AttachDialog messageId={id} tickets={tickets} open={attaching} onOpenChange={setAttaching} />
    </div>
  );
}
