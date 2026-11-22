"use client";

import { Button } from "@bibi/ui";
import { HistoryIcon } from "lucide-react";
import { createContext, type ReactNode, use, useState } from "react";

type PanelState = { open: boolean; toggle: () => void };

const PanelContext = createContext<PanelState>({ open: false, toggle: () => {} });

/** Holds whether the order's versions are shown under the Program header (ADR 0116). */
export function VersionsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <PanelContext value={{ open, toggle: () => setOpen((value) => !value) }}>
      {children}
    </PanelContext>
  );
}

/** "Versions" beside the program's add buttons: shows or hides the versions. */
export function VersionsToggle({ label }: { label: string }) {
  const { open, toggle } = use(PanelContext);
  return (
    <Button variant="outline" onClick={toggle} aria-expanded={open}>
      <HistoryIcon aria-hidden />
      {label}
    </Button>
  );
}

export type VersionSyncPillProps = {
  /** The order no longer matches the quote last sent: amber, else green. */
  changed: boolean;
  children: ReactNode;
};

/** Whether the order matches the quote last sent, as a pill that shows the versions. */
export function VersionSyncPill({ changed, children }: VersionSyncPillProps) {
  const { open, toggle } = use(PanelContext);
  return (
    <button
      type="button"
      data-slot="version-sync"
      onClick={toggle}
      aria-expanded={open}
      className={
        changed
          ? "inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-warning/15 px-2.5 py-1 text-sm text-warning-foreground hover:bg-warning/25"
          : "inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-sm hover:bg-success/20"
      }
    >
      <span
        aria-hidden
        className={changed ? "size-2 rounded-full bg-warning" : "size-2 rounded-full bg-success"}
      />
      {children}
    </button>
  );
}

export type VersionsPanelProps = { title: string; closeLabel: string; children: ReactNode };

/** The versions, inline under the Program header while open. */
export function VersionsPanel({ title, closeLabel, children }: VersionsPanelProps) {
  const { open, toggle } = use(PanelContext);
  if (!open) return null;
  return (
    <div data-slot="versions-panel" className="grid gap-3 rounded-xl border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-medium">{title}</h3>
        <Button variant="ghost" size="sm" onClick={toggle}>
          {closeLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}
