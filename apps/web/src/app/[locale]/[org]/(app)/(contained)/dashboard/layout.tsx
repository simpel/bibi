import { FlowMemory } from "@bibi/ui";
import type { ReactNode } from "react";

type DashboardLayoutProps = { children: ReactNode };

/**
 * Above the tab and range segments, so it survives a change of tab, range or customer: the page below
 * remounts, and its totals animate from the values `FlowMemory` keeps.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <FlowMemory>{children}</FlowMemory>;
}
