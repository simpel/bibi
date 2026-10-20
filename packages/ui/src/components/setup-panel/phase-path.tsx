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

export type PathPhase = { name: string; color?: string };

type PhaseNodeData = { name: string; color?: string };
type PhaseNode = Node<PhaseNodeData, "phase">;

function PhaseNodeView({ data }: NodeProps<PhaseNode>) {
  return (
    <SetupTargetCard
      target={{ kind: "phase", name: data.name }}
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

/**
 * The phases in order as a React Flow path: fit to view, no editing, pan or zoom (ADR 0045).
 * Inside a setup selection each phase is a button that opens its comment box.
 */
export function PhasePath({ phases, label }: PhasePathProps) {
  const { nodes, edges } = toFlow({ phases });
  const interactive = useSetupSelection() !== null;
  const flow = (
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
  );
  // Read-only it is one labelled picture; selectable, its phase buttons are reachable on their own.
  return interactive ? (
    <div data-slot="phase-path" className="h-24 w-full">
      {flow}
    </div>
  ) : (
    <div data-slot="phase-path" role="img" aria-label={label} className="h-24 w-full">
      {flow}
    </div>
  );
}
