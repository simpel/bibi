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
   * (`header`: under 42rem of an `@container/header` they fold, under 64rem they show only their
   * icons), so a page beside the sidebar folds too.
   */
  foldBy?: "screen" | "header";
  className?: string;
};

/** Which layout shows when: `icons` is the in-between width (labels hidden), if the mode has one. */
const FOLD = {
  screen: { row: "hidden md:flex", icons: null, menu: "md:hidden" },
  header: {
    row: "hidden @5xl/header:flex",
    icons: "hidden @2xl/header:flex @5xl/header:hidden",
    menu: "@2xl/header:hidden",
  },
} as const;

const variantOf = ({ action, index }: { action: TitleRowAction; index: number }) =>
  action.variant ?? (index === 0 ? "default" : "outline");

/**
 * The actions of a title row (the header rule in `CLAUDE.md`): side by side from `md` up. On
 * smaller screens one action stays a button and several fold into one menu, each action with
 * `items` as a submenu; in a page header short on width the secondary ones first drop their labels (the
 * primary never does). Every
 * layout is rendered and switched in CSS, so nothing flickers.
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
  const fold = FOLD[foldBy];
  const row = ({ iconOnly }: { iconOnly: boolean }) =>
    actions.map((action, index) => {
      const variant = variantOf({ action, index });
      // The primary action always keeps its label; only the secondary ones shrink to icons.
      return (
        <HeaderActionButton
          key={action.id}
          action={action}
          variant={variant}
          iconOnly={iconOnly && variant !== "default"}
        />
      );
    });
  return (
    <div data-slot="header-actions" className={cn("flex flex-wrap gap-2", className)}>
      <div className={cn("flex-wrap gap-2", folded ? fold.row : "flex")}>
        {row({ iconOnly: false })}
      </div>
      {folded && fold.icons ? (
        <div className={cn("flex-wrap gap-2", fold.icons)}>{row({ iconOnly: true })}</div>
      ) : null}
      {folded ? (
        <div className={fold.menu}>
          <HeaderActionButton action={more} variant="outline" />
        </div>
      ) : null}
    </div>
  );
}
