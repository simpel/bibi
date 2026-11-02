import { type Dispatch, useEffect, useRef } from "react";
import { usePathname } from "@/lib/navigation";
import { stepFromPathname, withStepPath } from "./intake-path";
import type { IntakeAction, IntakeState, IntakeStep } from "./intake-state";
import { openableStep } from "./openable-step";

type Write = "push" | "replace";

/**
 * Shallow URL change (Next keeps `usePathname` in sync with native history calls): the page is
 * not fetched again, so the one intake reducer stays mounted. The query (`?fromMessage=`) stays.
 */
function writeStep({ step, write }: { step: IntakeStep; write: Write }) {
  const { pathname, search } = window.location;
  const url = `${withStepPath({ pathname, step })}${search}`;
  if (write === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export type UseStepUrlInput = {
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  /** The draft was read: before that the open step is not settled and the URL is left alone. */
  ready: boolean;
  messageEnabled: boolean;
};

/**
 * Keeps the open step in the path both ways (spec "The page"): a new open step pushes
 * `/new/ticket/<step>` (the first sync replaces, so the load's URL is corrected in place), and
 * Back or Forward opens the URL's step, or the first step still missing input.
 */
export function useStepUrl({ state, dispatch, ready, messageEnabled }: UseStepUrlInput) {
  const pathname = usePathname();
  const synced = useRef(false);
  const seen = useRef(pathname);
  useEffect(() => {
    if (!ready) return;
    const current = stepFromPathname({ pathname: window.location.pathname });
    if (current !== state.open) {
      writeStep({ step: state.open, write: synced.current ? "push" : "replace" });
    }
    synced.current = true;
  }, [ready, state.open]);
  useEffect(() => {
    if (!ready || pathname === seen.current) return;
    seen.current = pathname;
    const step = stepFromPathname({ pathname });
    if (!step || step === state.open) return;
    const target = openableStep({ state, step, messageEnabled });
    if (target !== step) writeStep({ step: target, write: "replace" });
    dispatch({ type: "change", step: target });
  }, [ready, pathname, state, dispatch, messageEnabled]);
}
