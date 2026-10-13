"use client";

import { createContext, useContext } from "react";
import type { StoredDecision } from "../lib/stored-messages";

/** What approval cards need from the chat: the conversation and decisions already stored. */
export type ApprovalContextValue = {
  conversationId: string | null;
  decisions: readonly StoredDecision[];
};

const EMPTY: ApprovalContextValue = { conversationId: null, decisions: [] };

export const ApprovalContext = createContext<ApprovalContextValue>(EMPTY);

export function useApprovalContext(): ApprovalContextValue {
  return useContext(ApprovalContext);
}
