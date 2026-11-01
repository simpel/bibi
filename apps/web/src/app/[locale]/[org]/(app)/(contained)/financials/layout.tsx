import { FlowMemory } from "@bibi/ui";
import type { ReactNode } from "react";

type FinancialsLayoutProps = { children: ReactNode };

/**
 * Above the period segment, so it survives a change of period or customer: the page below
 * remounts, and its totals animate from the values `FlowMemory` keeps.
 */
export default function FinancialsLayout({ children }: FinancialsLayoutProps) {
  return <FlowMemory>{children}</FlowMemory>;
}
