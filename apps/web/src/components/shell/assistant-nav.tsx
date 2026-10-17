"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { ROUTES } from "@/lib/routes";
import { RecentConversations } from "./recent-conversations";
import { isActive, SidebarLink } from "./sidebar-link";

/** Top zone: the assistant home, "New chat" and the latest conversations (ADR 0035). */
export function AssistantNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { newConversation } = useAssistant();
  const onHome = isActive({ pathname, href: ROUTES.home });
  const startNew = () => {
    newConversation();
    router.push(ROUTES.home);
  };
  return (
    <nav aria-label={t("assistant")} className="grid gap-1">
      <SidebarLink href={ROUTES.home} label={t("assistant")} icon={SparklesIcon} active={onHome} />
      <button
        type="button"
        onClick={startNew}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <PlusIcon className="size-4" />
        {t("newChat")}
      </button>
      <RecentConversations onHome={onHome} />
    </nav>
  );
}
