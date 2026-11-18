"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { saveUserPreference } from "@/features/user-preference/actions";
import { type HelpHintId, helpDismissedKey } from "./help-hints";

type HelpValue = {
  isDismissed: (input: { id: HelpHintId }) => boolean;
  dismiss: (input: { id: HelpHintId }) => void;
  /** Shows a closed hint or finished tour again, here and on every device. */
  reset: (input: { id: HelpHintId }) => void;
};

const HelpContext = createContext<HelpValue | null>(null);

export type HelpProviderProps = {
  /** The hints the user closed before, loaded once by the layout. */
  dismissed: readonly HelpHintId[];
  children: ReactNode;
};

/** Which help hints the signed-in user has closed; closing one hides it at once and for good. */
export function HelpProvider({ dismissed, children }: HelpProviderProps) {
  const [closed, setClosed] = useState<ReadonlySet<HelpHintId>>(() => new Set(dismissed));
  const value = useMemo<HelpValue>(
    () => ({
      isDismissed: ({ id }) => closed.has(id),
      dismiss: ({ id }) => {
        setClosed((current) => new Set([...current, id]));
        // A preference is a convenience: if saving fails, the hint is back on the next load.
        void saveUserPreference({ key: helpDismissedKey({ id }), value: true });
      },
      reset: ({ id }) => {
        setClosed((current) => new Set([...current].filter((closedId) => closedId !== id)));
        void saveUserPreference({ key: helpDismissedKey({ id }), value: false });
      },
    }),
    [closed],
  );
  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp(): HelpValue {
  const value = useContext(HelpContext);
  if (!value) throw new Error("useHelp needs a HelpProvider");
  return value;
}
