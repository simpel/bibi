import { cn } from "@bibi/ui";
import type { ReactNode } from "react";

export type MockupFrameProps = { title: string; children: ReactNode; className?: string };

/** A static product window. Decorative: marked hidden from assistive tech, copy is mock data. */
export function MockupFrame({ title, children, className }: MockupFrameProps) {
  return (
    <div
      aria-hidden
      className={cn("overflow-hidden rounded-xl border bg-card text-left shadow-lg", className)}
    >
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-3 text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="grid gap-3 p-5 text-sm">{children}</div>
    </div>
  );
}
