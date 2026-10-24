import { useCallback, useEffect, useState } from "react";
import { loadLineAllocationsAction } from "../actions";
import type { AllocationView } from "./allocation-types";

export type LineAllocationsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; view: AllocationView | null };

export type UseLineAllocationsInput = { lineId: string; open: boolean };

/** Reads the line's slots and their free units each time the picker opens; `reload` after a save. */
export function useLineAllocations({ lineId, open }: UseLineAllocationsInput) {
  const [state, setState] = useState<LineAllocationsState>({ status: "loading" });
  const reload = useCallback(async () => {
    try {
      const result = await loadLineAllocationsAction({ lineId });
      setState(result.ok ? { status: "ready", view: result.value } : { status: "error" });
    } catch {
      setState({ status: "error" });
    }
  }, [lineId]);
  useEffect(() => {
    if (!open) return;
    setState({ status: "loading" });
    void reload();
  }, [open, reload]);
  return { state, reload };
}
