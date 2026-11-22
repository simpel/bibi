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
