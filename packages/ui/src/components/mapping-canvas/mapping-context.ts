"use client";

import { createContext, useContext } from "react";
import type { MappingAccount, MappingCanvasLabels } from "./mapping-types";

export type MappingContextValue = {
  labels: MappingCanvasLabels;
  accounts: MappingAccount[];
  disabled: boolean;
  onConnect: (input: { purposeId: string; accountId: string }) => void;
  onDisconnect: (input: { purposeId: string }) => void;
  onUnpin: (input: { accountId: string }) => void;
};

export const MappingContext = createContext<MappingContextValue | null>(null);

export function useMappingContext(): MappingContextValue {
  const value = useContext(MappingContext);
  if (!value) throw new Error("MappingContext is missing");
  return value;
}
