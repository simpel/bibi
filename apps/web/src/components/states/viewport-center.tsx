import type { ReactNode } from "react";

export type ViewportCenterProps = { children: ReactNode };

/**
 * Centres a whole-page state (loading, a failed load) on the viewport, not on the content column,
 * so it sits in the same place on every page whatever the header or sidebar. The layer lets clicks
 * through to the shell; only the content takes them.
 */
export function ViewportCenter({ children }: ViewportCenterProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-6">
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}
