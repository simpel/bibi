"use client";

import type { UiComponent } from "@bibi/ai";
import { resolveToolUi } from "@bibi/ai/ui";
import { type ComponentType, useMemo } from "react";
import { GENERATIVE_COMPONENTS } from "./components";
import type { GenerativeProps, ToolContext } from "./generative-props";

export type ToolResultViewProps = ToolContext & { toolName: string; output: unknown };

/**
 * A tool result as a card: `resolveToolUi` (from `@bibi/ai/ui`) picks the component key and
 * validated props, `GENERATIVE_COMPONENTS` maps the key to its React component.
 */
export function ToolResultView({ toolName, output, toolCallId }: ToolResultViewProps) {
  const ui = useMemo(() => resolveToolUi({ toolName, output }), [toolName, output]);
  // Sound by construction: `resolveToolUi` pairs each component key with that key's props.
  const Component = GENERATIVE_COMPONENTS[ui.component] as ComponentType<
    GenerativeProps<UiComponent>
  >;
  return <Component {...ui.props} toolName={toolName} toolCallId={toolCallId} />;
}
