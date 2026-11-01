"use client";

import { EllipsisIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { TitleRowAction } from "./header-action";
import { HeaderActionButton } from "./header-action-button";

export type HeaderActionsProps = {
  actions: TitleRowAction[];
  /** The one menu's label when several actions fold together on small screens. */
  moreLabel: string;
  className?: string;
};

const variantOf = ({ action, index }: { action: TitleRowAction; index: number }) =>
  action.variant ?? (index === 0 ? "default" : "outline");

/**
 * The actions of a title row (the header rule in `CLAUDE.md`): side by side from `md` up. On
 * smaller screens one action stays a button and several fold into one menu, each action with
 * `items` as a submenu. Both layouts are rendered and switched in CSS, so nothing flickers.
 */
export function HeaderActions({ actions, moreLabel, className }: HeaderActionsProps) {
  if (actions.length === 0) return null;
  const folded = actions.length > 1;
  const more = { id: "more", label: moreLabel, icon: <EllipsisIcon aria-hidden />, items: actions };
  return (
    <div data-slot="header-actions" className={cn("flex flex-wrap gap-2", className)}>
      <div className={cn("flex-wrap gap-2", folded ? "hidden md:flex" : "flex")}>
        {actions.map((action, index) => (
          <HeaderActionButton
            key={action.id}
            action={action}
            variant={variantOf({ action, index })}
          />
        ))}
      </div>
      {folded ? (
        <div className="md:hidden">
          <HeaderActionButton action={more} variant="outline" />
        </div>
      ) : null}
    </div>
  );
}
