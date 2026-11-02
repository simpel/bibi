import type { PreviewEntry } from "@bibi/core";
import { useEffect, useRef, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { previewTicketLinesAction } from "../actions";
import { toPreviewLine } from "./create-input";
import type { DraftLine } from "./draft-line";
import type { IntakePeriod } from "./intake-period";

export type DraftPreview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; entry: PreviewEntry; statusId: string; availabilityHidden: boolean };

export type UseDraftPreviewInput = {
  customerId: string;
  period: IntakePeriod | null;
  headcount: number;
  lines: DraftLine[];
  /** Changing it previews again with the same draft (after a CONFLICT on Create). */
  nonce: number;
};

const WAIT_MS = 300;

type RequestInput = Parameters<typeof previewTicketLinesAction>[0];

/** One preview call as the hook's state; a thrown call is the network error. */
async function requestPreview({ input }: RequestInput): Promise<DraftPreview> {
  try {
    const result = await previewTicketLinesAction({ input });
    if (!result.ok) return { status: "error", errorKey: errorKeyForCode(result.error) };
    const [entry] = result.value.entries;
    const { statusId, availabilityHidden } = result.value;
    return entry ? { status: "ready", entry, statusId, availabilityHidden } : { status: "idle" };
  } catch {
    return { status: "error", errorKey: "network" };
  }
}

/**
 * The draft lines planned by `ticket.previewLines` (ADR 0081), again shortly after the lines,
 * period, headcount or customer change. Nothing is written. Without lines there is nothing to
 * plan; the entry status then comes from the first preview with lines.
 */
export function useDraftPreview({
  customerId,
  period,
  headcount,
  lines,
  nonce,
}: UseDraftPreviewInput): DraftPreview {
  const [state, setState] = useState<DraftPreview>({ status: "idle" });
  const startsAt = period?.startsAt.toISOString() ?? "";
  const endsAt = period?.endsAt.toISOString() ?? "";
  const latest = useRef(lines);
  latest.current = lines;
  const draft = JSON.stringify(lines.map((line) => toPreviewLine({ line })));
  useEffect(() => {
    if (!startsAt || draft === "[]" || nonce < 0) {
      setState({ status: "idle" });
      return;
    }
    let current = true;
    setState((before) => (before.status === "ready" ? before : { status: "loading" }));
    const query = { customerId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), headcount };
    const timer = setTimeout(() => {
      const lines = latest.current.map((line) => toPreviewLine({ line }));
      void requestPreview({ input: { ...query, lines } }).then((next) => current && setState(next));
    }, WAIT_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [customerId, startsAt, endsAt, headcount, draft, nonce]);
  return state;
}
