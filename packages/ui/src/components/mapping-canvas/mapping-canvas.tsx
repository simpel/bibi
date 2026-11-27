"use client";

import "@xyflow/react/dist/style.css";
import { type Connection, type Edge, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useMemo } from "react";
import { cn } from "../../lib/cn";
import { Combobox } from "../combobox/combobox";
import { AccountNodeView } from "./account-node";
import { parseConnection } from "./build-graph";
import { MappingContext } from "./mapping-context";
import { MappingEdgeView } from "./mapping-edge";
import type { MappingAccount, MappingCanvasLabels, MappingPurpose } from "./mapping-types";
import { PurposeNodeView } from "./purpose-node";
import { useMappingGraph } from "./use-mapping-graph";

export type {
  MappingAccount,
  MappingCanvasLabels,
  MappingPurpose,
  MappingState,
} from "./mapping-types";

const NODE_TYPES = { purpose: PurposeNodeView, account: AccountNodeView };
const EDGE_TYPES = { mapping: MappingEdgeView };

export type MappingCanvasProps = {
  purposes: MappingPurpose[];
  /** Every selectable account (can be 1000+). */
  accounts: MappingAccount[];
  onConnect: (input: { purposeId: string; accountId: string }) => void;
  onDisconnect: (input: { purposeId: string }) => void;
  labels: MappingCanvasLabels;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

/**
 * Purposes on the left, the accounting system's accounts on the right, a line per mapping (controlled:
 * the lines come from `purposes[].accountId`). Every purpose also has a select, the keyboard route.
 */
export function MappingCanvas(props: MappingCanvasProps) {
  const { purposes, accounts, onConnect, onDisconnect, labels, className } = props;
  const disabled = props.disabled ?? false;
  const { graph, pin, unpin, onEdgesChange, hidden } = useMappingGraph({ purposes, accounts });
  const context = useMemo(
    () => ({ labels, accounts, disabled, onConnect, onDisconnect, onUnpin: unpin }),
    [labels, accounts, disabled, onConnect, onDisconnect, unpin],
  );
  const options = useMemo(
    () =>
      hidden.map((account) => ({
        value: account.id,
        label: account.label,
        ...(account.detail ? { description: account.detail } : {}),
      })),
    [hidden],
  );
  const connect = ({ connection }: { connection: Connection }) => {
    const parsed = parseConnection(connection);
    if (parsed && !disabled) onConnect(parsed);
  };
  const deleted = ({ edges }: { edges: Edge[] }) => {
    if (disabled) return;
    for (const edge of edges) {
      const purposeId = (edge.data as { purposeId?: string } | undefined)?.purposeId;
      if (purposeId) onDisconnect({ purposeId });
    }
  };
  return (
    <div data-slot="mapping-canvas" className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-4 px-1 pb-2 text-sm font-medium">
        <span>{labels.purposes}</span>
        <div className="flex items-center gap-3">
          <span>{labels.accounts}</span>
          {disabled ? null : (
            <Combobox
              options={options}
              onValueChange={(accountId) => pin({ accountId })}
              placeholder={labels.addAccount}
              searchPlaceholder={labels.searchAccounts}
              emptyText={labels.noAccountFound}
              className="h-8 w-56 text-xs"
            />
          )}
        </div>
      </div>
      <div
        style={{ height: graph.height }}
        className="w-full overflow-hidden rounded-lg border bg-muted/30"
      >
        <MappingContext.Provider value={context}>
          <ReactFlowProvider>
            <ReactFlow
              key={`${purposes.length}:${graph.visibleAccounts.length}`}
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              onConnect={(connection) => connect({ connection })}
              onEdgesChange={onEdgesChange}
              onEdgesDelete={(edges) => deleted({ edges })}
              isValidConnection={(connection) => parseConnection(connection) !== null}
              deleteKeyCode={disabled ? null : ["Backspace", "Delete"]}
              fitView
              fitViewOptions={{ padding: 0.05, maxZoom: 1 }}
              nodesDraggable={false}
              nodesConnectable={!disabled}
              nodesFocusable={false}
              edgesFocusable={!disabled}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
            />
          </ReactFlowProvider>
        </MappingContext.Provider>
      </div>
    </div>
  );
}
