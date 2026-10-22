import { Link } from "@bibi/i18n/navigation";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
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
    <div className="mt-2 grid gap-0.5">
      <span className="px-3 text-xs font-medium text-muted-foreground">{t("recent")}</span>
      <ul className="grid gap-0.5">
        {items.slice(0, RECENT_LIMIT).map(({ id, title }) => {
          const current = onHome && id === session.conversationId;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => void selectConversation({ id })}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "w-full truncate rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  current && "bg-accent text-accent-foreground",
                )}
              >
                {title}
              </button>
            </li>
          );
        })}
      </ul>
      <Link
        href={ROUTES.chats}
        className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {t("showMore")}
      </Link>
    </div>
  );
}
