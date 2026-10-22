"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { EMPTY_DRAFT, type SetupDraft } from "../../lib/setup-draft";

type SetupDraftContextValue = {
  org: string;
  draft: SetupDraft;
  setDraft: ({ draft }: { draft: SetupDraft }) => void;
  /** False until the sessionStorage copy has been read, so steps do not bounce early. */
  ready: boolean;
};

const SetupDraftContext = createContext<SetupDraftContextValue | null>(null);

const storageKey = ({ org }: { org: string }) => `welcome.setup.${org}`;

function readStored({ org }: { org: string }): SetupDraft | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey({ org }));
    return raw ? (JSON.parse(raw) as SetupDraft) : null;
  } catch {
    return null;
  }
}

function writeStored({ org, draft }: { org: string; draft: SetupDraft }): void {
  try {
    window.sessionStorage.setItem(storageKey({ org }), JSON.stringify(draft));
  } catch {
    // Storage may be blocked; the draft still lives in the layout while the tab is open.
  }
}

/**
 * Holds the setup draft across the step pages (the layout persists between sibling routes),
 * with a sessionStorage copy for a reload (ADR 0061). Nothing is saved until Activate.
 */
export function SetupDraftProvider({ org, children }: { org: string; children: ReactNode }) {
  const [draft, setState] = useState<SetupDraft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = readStored({ org });
    if (stored) setState(stored);
    setReady(true);
  }, [org]);
  const setDraft = ({ draft: next }: { draft: SetupDraft }) => {
    setState(next);
    writeStored({ org, draft: next });
  };
  return (
    <SetupDraftContext.Provider value={{ org, draft, setDraft, ready }}>
      {children}
    </SetupDraftContext.Provider>
  );
}

/** The setup draft; only inside `/:org/welcome/setup/*`. */
export function useSetupDraft(): SetupDraftContextValue {
  const value = useContext(SetupDraftContext);
  if (!value) throw new Error("useSetupDraft outside SetupDraftProvider");
  return value;
}
