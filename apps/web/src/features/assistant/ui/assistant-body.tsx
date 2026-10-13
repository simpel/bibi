"use client";

import { useAssistant } from "../state/assistant-context";
import { AssistantHeader } from "./assistant-header";
import { ChatView } from "./chat-view";
import { HistoryView } from "./history-view";

export type AssistantBodyProps = { showClose: boolean };

/** Header plus the chat or the history, whichever the user is looking at. */
export function AssistantBody({ showClose }: AssistantBodyProps) {
  const { view } = useAssistant();
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card text-card-foreground">
      <AssistantHeader showClose={showClose} />
      {view === "history" ? <HistoryView /> : <ChatView />}
    </div>
  );
}
