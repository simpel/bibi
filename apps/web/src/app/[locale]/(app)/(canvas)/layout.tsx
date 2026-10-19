import type { ReactNode } from "react";

type CanvasLayoutProps = { children: ReactNode };

/**
 * Full-width pages (ADR 0038): the calendar and the assistant home. They fill the viewport below
 * the top bar and decide for themselves which part is capped (a toolbar, the chat column). They
 * are where staff land.
 */
export default function CanvasLayout({ children }: CanvasLayoutProps) {
  return <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">{children}</div>;
}
