import type { ReactNode } from "react";

/**
 * Lists, details, forms and settings (ADR 0038). The layout adds no container: a page is one
 * `SimplePage`, or several `PageSection`s (edge to edge, each with a `PageContainer` inside).
 */
export default function ContainedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
