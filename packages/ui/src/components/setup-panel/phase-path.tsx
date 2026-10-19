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
import { Card } from "../card/card";
import { ColorSwatch } from "../color-swatch/color-swatch";

export type PathPhase = { name: string; color?: string };

type PhaseNodeData = { name: string; color?: string };
type PhaseNode = Node<PhaseNodeData, "phase">;

function PhaseNodeView({ data }: NodeProps<PhaseNode>) {
  return (
    <Card className="flex items-center gap-2 px-3 py-2 text-sm shadow-none">
      <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0" />
      {data.color ? <ColorSwatch color={data.color} /> : null}
      {data.name}
      <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0" />
    </Card>
  );
}

const NODE_TYPES = { phase: PhaseNodeView };
const GAP = 190;

function toFlow({ phases }: { phases: PathPhase[] }) {
  const nodes: PhaseNode[] = phases.map((phase, index) => ({
    id: String(index),
    type: "phase",
    position: { x: index * GAP, y: 0 },
    data: phase,
  }));
  const edges: Edge[] = phases.slice(1).map((_, index) => ({
    id: `e${index}`,
    source: String(index),
    target: String(index + 1),
  }));
  return { nodes, edges };
}

export type PhasePathProps = { phases: PathPhase[]; label: string };

/** The phases in order as a read-only React Flow path: fit to view, no editing, pan or zoom. */
export function PhasePath({ phases, label }: PhasePathProps) {
  const { nodes, edges } = toFlow({ phases });
  return (
    <div data-slot="phase-path" role="img" aria-label={label} className="h-24 w-full">
      <ReactFlowProvider>
        <ReactFlow
          key={phases.map((phase) => phase.name).join("|")}
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
    </div>
  );
}
