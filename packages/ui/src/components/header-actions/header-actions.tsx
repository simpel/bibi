"use client";

import { EllipsisIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { TitleRowAction } from "./header-action";
import { HeaderActionButton } from "./header-action-button";

export type HeaderActionsProps = {
  actions: TitleRowAction[];
  /** The one menu's label when several actions fold together on small screens. */
  moreLabel: string;
  /**
   * What decides when they fold: the screen (`md`, the default) or the page header's own width
   * (`header`: under 42rem of an `@container/header`), so a page beside the sidebar folds too.
   */
  foldBy?: "screen" | "header";
  className?: string;
};

const FOLD = {
  screen: { row: "hidden md:flex", menu: "md:hidden" },
  header: { row: "hidden @2xl/header:flex", menu: "@2xl/header:hidden" },
} as const;

const variantOf = ({ action, index }: { action: TitleRowAction; index: number }) =>
  action.variant ?? (index === 0 ? "default" : "outline");

/**
 * The actions of a title row (the header rule in `CLAUDE.md`): side by side from `md` up. On
 * smaller screens one action stays a button and several fold into one menu, each action with
 * `items` as a submenu. Both layouts are rendered and switched in CSS, so nothing flickers.
 */
export function HeaderActions({
  actions,
  moreLabel,
  foldBy = "screen",
  className,
}: HeaderActionsProps) {
  if (actions.length === 0) return null;
  const folded = actions.length > 1;
  const more = { id: "more", label: moreLabel, icon: <EllipsisIcon aria-hidden />, items: actions };
  return (
    <div data-slot="header-actions" className={cn("flex flex-wrap gap-2", className)}>
      <div className={cn("flex-wrap gap-2", folded ? FOLD[foldBy].row : "flex")}>
        {actions.map((action, index) => (
          <HeaderActionButton
            key={action.id}
            action={action}
            variant={variantOf({ action, index })}
          />
        ))}
      </div>
      {folded ? (
        <div className={FOLD[foldBy].menu}>
          <HeaderActionButton action={more} variant="outline" />
        </div>
      ) : null}
    </div>
  );
}
