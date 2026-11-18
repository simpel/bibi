import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type HelpPanelProps = {
  children: ReactNode;
  /** Hides the panel for good; the caller remembers it. */
  onDismiss: () => void;
  /** The close button's accessible name, e.g. "Hide this help". */
  dismissLabel: string;
  /** Fixed at the bottom centre of the screen, above the page; else in the page's flow. */
  floating?: boolean;
  className?: string;
};

/**
 * A small piece of help a user closes once (a legend or a tip), with an X. Floating it sits at the
 * bottom centre, clear of the pinned tray on the right; inline it is a muted box in the page.
 */
export function HelpPanel({
  children,
  onDismiss,
  dismissLabel,
  floating,
  className,
}: HelpPanelProps) {
  const panel = (
    <div
      data-slot="help-panel"
      role="note"
      className={cn(
        "flex items-center gap-3 rounded-lg border py-2.5 pr-2 pl-4 text-popover-foreground",
        floating
          ? "pointer-events-auto max-w-full bg-popover shadow-xl ring-1 ring-foreground/5"
          : "bg-muted/40",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 shrink-0 self-start text-muted-foreground hover:text-foreground"
        onClick={onDismiss}
        aria-label={dismissLabel}
        title={dismissLabel}
      >
        <XIcon aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
  if (!floating) return panel;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center">
      {panel}
    </div>
  );
}
