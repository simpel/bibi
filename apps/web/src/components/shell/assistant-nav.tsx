"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { cn } from "@okazi/ui";
import { SquarePenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { ROUTES } from "@/lib/routes";
import { RecentConversations } from "./recent-conversations";
import { isActive } from "./sidebar-link";

/** Top zone: "New chat" and the latest conversations (ADR 0035). The assistant is the home page. */
export function AssistantNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { newConversation, session } = useAssistant();
  const onHome = isActive({ pathname, href: ROUTES.home });
  const startNew = () => {
    newConversation();
    router.push(ROUTES.home);
  };
  const fresh = onHome && !session.conversationId;
  return (
    <nav aria-label={t("assistant")} className="grid gap-1">
      <button
        type="button"
        onClick={startNew}
        aria-current={fresh ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          fresh && "bg-accent text-accent-foreground",
        )}
      >
        <SquarePenIcon className="size-4" />
        {t("newChat")}
      </button>
      <RecentConversations onHome={onHome} />
    </nav>
  );
}
