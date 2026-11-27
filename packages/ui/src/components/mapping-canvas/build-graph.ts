import type { Edge, Node } from "@xyflow/react";
import type { MappingAccount, MappingPurpose, MappingState } from "./mapping-types";

export const PURPOSE_WIDTH = 340;
export const ACCOUNT_WIDTH = 260;
export const COLUMN_GAP = 180;
export const PURPOSE_ROW = 112;
export const ACCOUNT_ROW = 84;
export const MIN_HEIGHT = 280;
const PADDING = 16;

export type PurposeNodeData = { purpose: MappingPurpose };
export type AccountNodeData = {
  account: MappingAccount;
  /** Worst state of the purposes connected to it, or null when none is. */
  state: Exclude<MappingState, "unmapped"> | null;
  /** Shown only because it was pinned, so it can be unpinned. */
  pinnedOnly: boolean;
};
export type PurposeNode = Node<PurposeNodeData, "purpose">;
export type AccountNode = Node<AccountNodeData, "account">;
export type MappingEdgeData = { purposeId: string; state: MappingState };
export type MappingEdge = Edge<MappingEdgeData, "mapping">;

export const purposeNodeId = ({ id }: { id: string }) => `p:${id}`;
export const accountNodeId = ({ id }: { id: string }) => `a:${id}`;

export type ParsedConnection = { purposeId: string; accountId: string };
export type ParseConnectionInput = { source: string | null; target: string | null };

/** The purpose and account ids of a drawn line, or null unless it runs purpose to account. */
export function parseConnection({ source, target }: ParseConnectionInput): ParsedConnection | null {
  if (!source?.startsWith("p:") || !target?.startsWith("a:")) return null;
  return { purposeId: source.slice(2), accountId: target.slice(2) };
}

export type BuildGraphInput = {
  purposes: MappingPurpose[];
  accounts: MappingAccount[];
  pinned: ReadonlySet<string>;
  selectedEdgeId?: string | null;
};

export type MappingGraph = {
  nodes: Array<PurposeNode | AccountNode>;
  edges: MappingEdge[];
  visibleAccounts: MappingAccount[];
  height: number;
  width: number;
};

/** Pure, deterministic layout: purposes left in given order, shown accounts right in `accounts` order. */
export function buildGraph({
  purposes,
  accounts,
  pinned,
  selectedEdgeId = null,
}: BuildGraphInput): MappingGraph {
  const known = new Set(accounts.map((account) => account.id));
  const mapped = new Set<string>();
  for (const purpose of purposes) {
    if (purpose.accountId && known.has(purpose.accountId)) mapped.add(purpose.accountId);
  }
  const visibleAccounts = accounts.filter(
    (account) => mapped.has(account.id) || pinned.has(account.id),
  );
  const worst = new Map<string, "ok" | "attention">();
  const edges: MappingEdge[] = [];
  for (const purpose of purposes) {
    if (!purpose.accountId || !known.has(purpose.accountId)) continue;
    const state = purpose.state === "attention" ? "attention" : "ok";
    if (worst.get(purpose.accountId) !== "attention") worst.set(purpose.accountId, state);
    const id = `e:${purpose.id}`;
    edges.push({
      id,
      type: "mapping",
      source: purposeNodeId({ id: purpose.id }),
      target: accountNodeId({ id: purpose.accountId }),
      selected: id === selectedEdgeId,
      data: { purposeId: purpose.id, state: purpose.state },
    });
  }
  const purposeNodes: PurposeNode[] = purposes.map((purpose, index) => ({
    id: purposeNodeId({ id: purpose.id }),
    type: "purpose",
    position: { x: 0, y: PADDING + index * PURPOSE_ROW },
    draggable: false,
    data: { purpose },
  }));
  const accountNodes: AccountNode[] = visibleAccounts.map((account, index) => ({
    id: accountNodeId({ id: account.id }),
    type: "account",
    position: { x: PURPOSE_WIDTH + COLUMN_GAP, y: PADDING + index * ACCOUNT_ROW },
    draggable: false,
    data: {
      account,
      state: worst.get(account.id) ?? null,
      pinnedOnly: !mapped.has(account.id),
    },
  }));
  const rows = Math.max(purposes.length * PURPOSE_ROW, visibleAccounts.length * ACCOUNT_ROW);
  return {
    nodes: [...purposeNodes, ...accountNodes],
    edges,
    visibleAccounts,
    height: Math.max(MIN_HEIGHT, rows + PADDING * 2),
    width: PURPOSE_WIDTH + COLUMN_GAP + ACCOUNT_WIDTH,
  };
}
