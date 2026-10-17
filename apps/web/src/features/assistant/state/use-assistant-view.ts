"use client";

import { useState } from "react";
import type { AssistantView } from "./assistant-context";

/** Whether the assistant on the start page shows the chat or the conversation history. */
export function useAssistantView() {
  const [view, setView] = useState<AssistantView>("chat");
  return { view, setView };
}
