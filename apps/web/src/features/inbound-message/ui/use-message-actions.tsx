import type { HeaderAction, TitleRowAction } from "@bibi/ui";
import { EllipsisIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ticketFromMessageRoute } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import type { InboxAbilities } from "./inbox-row-actions";
import { useReadMessage } from "./use-read-message";

export type UseMessageActionsInput = InboxAbilities & {
  message: { id: string; read: boolean };
  onAttach: () => void;
  onDelete: () => void;
};

/** New ticket and attach as buttons, then mark read or unread and delete in the more menu. */
export function useMessageActions({
  message: { id, read },
  canWrite,
  canDelete,
  canCreateTicket,
  onAttach,
  onDelete,
}: UseMessageActionsInput): TitleRowAction[] {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const { setRead } = useReadMessage();
  const label = read ? t("markUnread") : t("markRead");
  const more: HeaderAction[] = [
    ...(canWrite
      ? [{ id: "read", label, onSelect: () => setRead({ ids: [id], read: !read }) }]
      : []),
    ...(canDelete ? [{ id: "delete", label: common("delete"), onSelect: onDelete }] : []),
  ];
  const open = () => router.push(ticketFromMessageRoute({ id }));
  return [
    ...(canCreateTicket
      ? [{ id: "ticket", label: t("newTicket"), icon: <PlusIcon aria-hidden />, onSelect: open }]
      : []),
    ...(canCreateTicket && canWrite
      ? [
          {
            id: "attach",
            label: t("attachTitle"),
            icon: <LinkIcon aria-hidden />,
            onSelect: onAttach,
          },
        ]
      : []),
    ...(more.length > 0
      ? [{ id: "more", label: common("actions"), icon: <EllipsisIcon aria-hidden />, items: more }]
      : []),
  ];
}
