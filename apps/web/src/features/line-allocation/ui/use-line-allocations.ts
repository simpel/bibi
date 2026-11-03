import { useCallback, useState } from "react";
import { loadLineAllocationsAction } from "../actions";
import type { AllocationView } from "./allocation-types";

export type LineAllocationsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; view: AllocationView | null };

export type LineAllocations = ReturnType<typeof useLineAllocations>;

/** The line's slots and their free units: `open` when the picker opens, `reload` after a save. */
export function useLineAllocations({ lineId }: { lineId: string }) {
  const [state, setState] = useState<LineAllocationsState>({ status: "loading" });
  const reload = useCallback(async () => {
    try {
      const result = await loadLineAllocationsAction({ lineId });
      setState(result.ok ? { status: "ready", view: result.value } : { status: "error" });
    } catch {
      setState({ status: "error" });
    }
  }, [lineId]);
  const open = useCallback(() => {
    setState({ status: "loading" });
    void reload();
  }, [reload]);
  return { state, open, reload };
}
