import type { HeaderAction, TitleRowAction } from "@bibi/ui";
import { EllipsisIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { orderFromMessageRoute } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import type { InboxAbilities } from "./inbox-row-actions";
import { useReadMessage } from "./use-read-message";

export type UseMessageActionsInput = InboxAbilities & {
  message: { id: string; read: boolean };
  onAttach: () => void;
  onDelete: () => void;
};

/** New order and attach as buttons, then mark read or unread and delete in the more menu. */
export function useMessageActions({
  message: { id, read },
  canWrite,
  canDelete,
  canCreateOrder,
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
  const open = () => router.push(orderFromMessageRoute({ id }));
  return [
    ...(canCreateOrder
      ? [{ id: "order", label: t("newOrder"), icon: <PlusIcon aria-hidden />, onSelect: open }]
      : []),
    ...(canCreateOrder && canWrite
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
