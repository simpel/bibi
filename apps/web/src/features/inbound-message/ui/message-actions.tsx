"use client";

import { HeaderActions } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import { AttachDialog } from "./attach-dialog";
import { DeleteMessageDialog } from "./delete-message-dialog";
import type { InboxAbilities } from "./inbox-row-actions";
import { useMessageActions } from "./use-message-actions";

export type MessageActionsProps = InboxAbilities & {
  message: { id: string; subject: string | null; read: boolean };
  orders: readonly NamedOption[];
};

/**
 * What staff do with an inbox message (ADR 0085): a new order or attach it to one, and in the
 * more menu mark it unread (or read) for the team or delete it.
 */
export function MessageActions({ message, orders, ...abilities }: MessageActionsProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const [attaching, setAttaching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const actions = useMessageActions({
    ...abilities,
    message,
    onAttach: () => setAttaching(true),
    onDelete: () => setDeleting(true),
  });
  return (
    <>
      {actions.length > 0 ? (
        <HeaderActions actions={actions} moreLabel={common("actions")} />
      ) : null}
      <AttachDialog
        messageId={message.id}
        orders={orders}
        open={attaching}
        onOpenChange={setAttaching}
      />
      <DeleteMessageDialog
        messages={deleting ? [message] : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => router.push(INBOX_ROUTE)}
      />
    </>
  );
}
