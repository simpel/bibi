import type { ReactNode } from "react";

/**
 * One action in a title row: a button that runs `onSelect`, or (with `items`) a menu of further
 * actions, which may nest again. A top-level action always has an icon; an item without one shows
 * its parent's.
 */
export type HeaderAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** The first action is the primary one; the rest default to `outline`. */
  variant?: "default" | "outline";
  onSelect?: () => void;
  items?: HeaderAction[];
};

/** A top-level action: its icon is required, so every button and menu item has one. */
export type TitleRowAction = HeaderAction & { icon: ReactNode };

export type CollapseInput = { action: HeaderAction };

/**
 * A menu with one choice is no menu: the action runs that choice itself, keeping its own label and
 * icon (repeatedly, for nested single choices).
 */
export function collapseSingleChoice({ action }: CollapseInput): HeaderAction {
  const [only, ...rest] = action.items ?? [];
  if (!only || rest.length > 0) return action;
  return collapseSingleChoice({
    action: { ...action, onSelect: only.onSelect, items: only.items },
  });
}
