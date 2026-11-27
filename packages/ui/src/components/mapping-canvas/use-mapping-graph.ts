"use client";

import type { EdgeChange } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { buildGraph, type MappingGraph } from "./build-graph";
import type { MappingAccount, MappingPurpose } from "./mapping-types";

export type UseMappingGraphInput = { purposes: MappingPurpose[]; accounts: MappingAccount[] };

/** Controlled graph: edges come from the props; only pins and edge selection are local. */
export function useMappingGraph({ purposes, accounts }: UseMappingGraphInput) {
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const graph: MappingGraph = useMemo(
    () => buildGraph({ purposes, accounts, pinned, selectedEdgeId }),
    [purposes, accounts, pinned, selectedEdgeId],
  );
  const pin = useCallback(({ accountId }: { accountId: string }) => {
    setPinned((current) => new Set(current).add(accountId));
  }, []);
  const unpin = useCallback(({ accountId }: { accountId: string }) => {
    setPinned((current) => {
      const next = new Set(current);
      next.delete(accountId);
      return next;
    });
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === "select") setSelectedEdgeId(change.selected ? change.id : null);
    }
  }, []);
  const hidden = useMemo(() => {
    const shown = new Set(graph.visibleAccounts.map((account) => account.id));
    return accounts.filter((account) => !shown.has(account.id));
  }, [accounts, graph.visibleAccounts]);
  return { graph, pin, unpin, onEdgesChange, hidden };
}
