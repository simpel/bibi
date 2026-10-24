"use client";

import "@xyflow/react/dist/style.css";
import {
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { ColorSwatch } from "../color-swatch/color-swatch";
import { useSetupSelection } from "./setup-selection";
import { SetupTargetCard } from "./setup-target";

export type PathStatus = { name: string; color?: string };

type StatusNodeData = { name: string; color?: string };
type StatusNode = Node<StatusNodeData, "status">;

function StatusNodeView({ data }: NodeProps<StatusNode>) {
  return (
    <SetupTargetCard
      target={{ kind: "status", name: data.name }}
      className="text-sm"
      contentClassName="flex items-center gap-2 px-3 py-2"
      before={
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="opacity-0"
        />
      }
      after={
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="opacity-0"
        />
      }
    >
      {data.color ? <ColorSwatch color={data.color} /> : null}
      {data.name}
    </SetupTargetCard>
  );
}

const NODE_TYPES = { ticketStatus: StatusNodeView };
const GAP = 190;

function toFlow({ statuses }: { statuses: PathStatus[] }) {
  const nodes: StatusNode[] = statuses.map((ticketStatus, index) => ({
    id: String(index),
    type: "status",
    position: { x: index * GAP, y: 0 },
    data: ticketStatus,
  }));
  const edges: Edge[] = statuses.slice(1).map((_, index) => ({
    id: `e${index}`,
    source: String(index),
    target: String(index + 1),
  }));
  return { nodes, edges };
}

export type StatusPathProps = { statuses: PathStatus[]; label: string };

/**
 * The statuses in order as a React Flow path: fit to view, no editing, pan or zoom (ADR 0045).
 * Inside a setup selection each status is a button that opens its comment box.
 */
export function StatusPath({ statuses, label }: StatusPathProps) {
  const { nodes, edges } = toFlow({ statuses });
  const interactive = useSetupSelection() !== null;
  const flow = (
    <ReactFlowProvider>
      <ReactFlow
        key={statuses.map((ticketStatus) => ticketStatus.name).join("|")}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      />
    </ReactFlowProvider>
  );
  // Read-only it is one labelled picture; selectable, its status buttons are reachable on their own.
  return interactive ? (
    <div data-slot="status-path" className="h-24 w-full">
      {flow}
    </div>
  ) : (
    <div data-slot="status-path" role="img" aria-label={label} className="h-24 w-full">
      {flow}
    </div>
  );
}
