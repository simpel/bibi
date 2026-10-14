"use client";

import type { ReactNode } from "react";
import { ApprovalContext } from "./approval-context";
import { AssistantContext } from "./assistant-context";
import { useAssistantController } from "./use-assistant-controller";

export type AssistantProviderProps = { children: ReactNode };

/** Mounted once in the authenticated shell: one chat session shared by panel, ⌘K and toggle. */
export function AssistantProvider({ children }: AssistantProviderProps) {
  const controller = useAssistantController();
  const { conversationId, decisions } = controller.session;
  return (
    <AssistantContext value={controller}>
      <ApprovalContext value={{ conversationId, decisions }}>{children}</ApprovalContext>
    </AssistantContext>
  );
}
