"use client";

import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from "@xyflow/react";
import { XIcon } from "lucide-react";
import type { MappingEdge } from "./build-graph";
import { useMappingContext } from "./mapping-context";

export function MappingEdgeView(props: EdgeProps<MappingEdge>) {
  const { id, data, selected } = props;
  const { labels, disabled, onDisconnect } = useMappingContext();
  const [path, labelX, labelY] = getBezierPath(props);
  const stroke = data?.state === "attention" ? "var(--warning)" : "var(--success)";
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={20}
        style={{ stroke, strokeWidth: selected ? 3.5 : 2 }}
      />
      {disabled || !data ? null : (
        <EdgeLabelRenderer>
          <button
            type="button"
            aria-label={labels.removeLine}
            title={labels.removeLine}
            onClick={() => onDisconnect({ purposeId: data.purposeId })}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan absolute flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-xs hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon aria-hidden className="size-3" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
