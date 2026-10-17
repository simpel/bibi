"use client";

import { useAssistant } from "../state/assistant-context";
import { AssistantHeader } from "./assistant-header";
import { ChatView } from "./chat-view";
import { HistoryView } from "./history-view";

/** Header plus the chat or the history, whichever the user is looking at. */
export function AssistantBody() {
  const { view } = useAssistant();
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card text-card-foreground">
      <AssistantHeader />
      {view === "history" ? <HistoryView /> : <ChatView />}
    </div>
  );
}
