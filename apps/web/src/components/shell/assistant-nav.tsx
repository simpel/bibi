"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { SquarePenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { usePathname } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { RecentConversations } from "./recent-conversations";
import { isActive } from "./sidebar-link";

/** Top zone: "Create chat" and the latest conversations (ADR 0035). The assistant is the home page. */
export function AssistantNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { newConversation, session, goHome } = useAssistant();
  const onHome = isActive({ pathname, href: ROUTES.home });
  const startNew = () => {
    newConversation();
    goHome();
  };
  const fresh = onHome && !session.conversationId;
  return (
    <nav aria-label={t("assistant")} className="min-w-0">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                isActive={fresh}
                aria-current={fresh ? "page" : undefined}
                tooltip={t("newChat")}
                onClick={startNew}
              >
                <SquarePenIcon />
                <span>{t("newChat")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
        <RecentConversations onHome={onHome} />
      </SidebarGroup>
    </nav>
  );
}
