import { Button } from "@bibi/ui";
import { MessagesSquareIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { ChatView } from "./chat-view";
import { ThreadsPanel } from "./threads-panel";

/**
 * The assistant page (ADR 0035; on `/assistant` since ADR 0110). The session lives in the shell, so a question asked
 * from ⌘K elsewhere continues here. A full page: it fills the viewport below the top bar (the
 * shell drops its padding and width cap for it), with the conversations in a column on the left
 * (a link to `/chats` on a phone).
 */
export async function AssistantHome() {
  const nav = await getTranslations("nav");
  return (
    <section data-slot="assistant-home" className="flex h-[calc(100dvh-3.5rem)]">
      <ThreadsPanel />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-3 pt-2 md:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.chats}>
              <MessagesSquareIcon />
              {nav("chats")}
            </Link>
          </Button>
        </div>
        <ChatView />
      </div>
    </section>
  );
}
