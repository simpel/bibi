import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

const RECENT_LIMIT = 5;

export type RecentConversationsProps = { onHome: boolean };

/** The latest five conversations and a link to all of them; opening one loads it on the assistant home (ADR 0035). */
export function RecentConversations({ onHome }: RecentConversationsProps) {
  const t = useTranslations("nav");
  const { conversations, session, selectConversation } = useAssistant();
  const { items, refresh } = conversations;
  useEffect(() => void refresh(), [refresh]);
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="h-6 px-2 text-xs font-medium text-sidebar-foreground/70">
        {t("recent")}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.slice(0, RECENT_LIMIT).map(({ id, title }) => {
          const current = onHome && id === session.conversationId;
          return (
            <SidebarMenuItem key={id} className="min-w-0">
              <SidebarMenuButton
                type="button"
                isActive={current}
                aria-current={current ? "page" : undefined}
                onClick={() => void selectConversation({ id })}
                title={title}
                className="h-8 text-sm font-normal text-muted-foreground hover:text-sidebar-accent-foreground data-[active=true]:text-sidebar-accent-foreground"
              >
                <span className="truncate">{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        <SidebarMenuItem className="min-w-0">
          <SidebarMenuButton
            asChild
            className="h-8 text-sm font-normal text-muted-foreground hover:text-sidebar-accent-foreground"
          >
            <Link href={ROUTES.chats}>
              <span>{t("showMore")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
