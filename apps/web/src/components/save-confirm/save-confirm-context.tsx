"use client";

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";
import { SaveConfirmDialog } from "./save-confirm-dialog";

/** One field of a save, as the user reads it: its label and its value before and after. */
export type SaveChange = { field: string; before: string; after: string };

export type ConfirmSave = (input: { changes: SaveChange[] }) => Promise<boolean>;

const SaveConfirmContext = createContext<ConfirmSave | null>(null);

/**
 * Whether a save has to be confirmed first. Without a provider (the administration pages) every
 * save goes ahead; inside one (the assistant's settings card) a dialog shows the change first.
 */
export function useConfirmSave(): ConfirmSave | null {
  return useContext(SaveConfirmContext);
}

type Pending = { changes: SaveChange[]; resolve: (confirmed: boolean) => void };

export type SaveConfirmProviderProps = { children: ReactNode };

/** Every save inside asks first, in one dialog with the change before and after. */
export function SaveConfirmProvider({ children }: SaveConfirmProviderProps) {
  const [pending, setPending] = useState<Pending | null>(null);
  const current = useRef<Pending | null>(null);
  const confirm = useCallback<ConfirmSave>(
    ({ changes }) =>
      new Promise<boolean>((resolve) => {
        current.current?.resolve(false);
        current.current = { changes, resolve };
        setPending(current.current);
      }),
    [],
  );
  const settle = ({ confirmed }: { confirmed: boolean }) => {
    current.current?.resolve(confirmed);
    current.current = null;
    setPending(null);
  };
  return (
    <SaveConfirmContext.Provider value={confirm}>
      {children}
      <SaveConfirmDialog
        changes={pending?.changes ?? null}
        onConfirm={() => settle({ confirmed: true })}
        onCancel={() => settle({ confirmed: false })}
      />
    </SaveConfirmContext.Provider>
  );
}
