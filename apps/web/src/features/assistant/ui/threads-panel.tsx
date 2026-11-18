"use client";

import { Button, Input } from "@bibi/ui";
import { SearchIcon, SquarePenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { ArchiveConversationDialog } from "./archive-conversation-dialog";
import { HistoryList, matchConversations } from "./history-list";
import { useConversationHistory } from "./use-conversation-history";

/**
 * The assistant page's secondary column (shadcn sidebar-09): the heading with "Create chat", a
 * search over titles and the user's conversations. Hidden below `md`, where `/chats` lists them.
 */
export function ThreadsPanel() {
  const t = useTranslations("assistant.history");
  const nav = useTranslations("nav");
  const { items, loading, errorKey, editing, setEditing, archiving, startNew } =
    useConversationHistory();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const matches = matchConversations({ items, query: needle }).length;
  return (
    <aside
      aria-label={nav("chats")}
      data-slot="assistant-threads"
      className="hidden w-72 shrink-0 flex-col border-r bg-sidebar md:flex"
    >
      <div className="flex flex-col gap-3 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-medium">{nav("chats")}</h2>
          <Button variant="ghost" size="icon" aria-label={nav("newChat")} onClick={startNew}>
            <SquarePenIcon />
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <InlineLoadError errorKey={errorKey} />
        {matches === 0 && !loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {needle ? t("noMatches") : t("empty")}
          </p>
        ) : null}
        <HistoryList editing={editing} onEdit={setEditing} query={needle} />
      </div>
      <ArchiveConversationDialog conversation={archiving} onClose={() => setEditing(null)} />
    </aside>
  );
}
