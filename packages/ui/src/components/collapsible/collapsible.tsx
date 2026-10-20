import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import type { ComponentProps } from "react";

export type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

/** A section that expands and collapses (shadcn Collapsible on Radix). */
export function Collapsible(props: CollapsibleProps) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.Trigger>;

export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

export type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.Content>;

export function CollapsibleContent(props: CollapsibleContentProps) {
  return <CollapsiblePrimitive.Content data-slot="collapsible-content" {...props} />;
}
