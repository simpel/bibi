"use client";

import { useEffect, useState } from "react";
import { loadTicketSheetAction } from "../actions";
import type { TicketSheetData } from "../load-ticket-sheet";

export type TicketSheetState =
  | { phase: "closed" }
  | { phase: "loading" }
  | { phase: "failed" }
  | { phase: "ready"; data: TicketSheetData };

/** The open ticket's sheet content, read once per ticket it opens on. */
export function useTicketSheet({ ticketId }: { ticketId: string | null }): TicketSheetState {
  const [state, setState] = useState<TicketSheetState>({ phase: "closed" });
  useEffect(() => {
    if (!ticketId) {
      setState({ phase: "closed" });
      return;
    }
    setState({ phase: "loading" });
    let current = true;
    loadTicketSheetAction({ id: ticketId }).then((result) => {
      if (!current) return;
      setState(result.ok ? { phase: "ready", data: result.value } : { phase: "failed" });
    });
    return () => {
      current = false;
    };
  }, [ticketId]);
  return state;
}
