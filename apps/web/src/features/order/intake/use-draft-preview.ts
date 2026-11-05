import type { OrderPreviewLines, PreviewEntry } from "@bibi/core";
import type { ErrorKey } from "@/lib/error-key";
import type { LiveQueryState } from "@/lib/live-query-state";
import { useLiveQuery } from "@/lib/use-live-query";
import { previewOrderLinesAction } from "../actions";
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

type Query = Parameters<typeof previewOrderLinesAction>[0];

/** `nonce` only makes the same draft a new input; the action does not take it. */
const preview = ({ input }: Query & { nonce: number }) => previewOrderLinesAction({ input });

/** The planned draft entry; a preview without one is idle. */
function entryOf({ value }: { value: OrderPreviewLines }): DraftPreview {
  const [entry] = value.entries;
  const { statusId, availabilityHidden } = value;
  return entry ? { status: "ready", entry, statusId, availabilityHidden } : { status: "idle" };
}

/** A new preview keeps showing the last planned entry until it answers. */
function draftOf({ state }: { state: LiveQueryState<OrderPreviewLines> }): DraftPreview {
  if (state.status === "ready") return entryOf({ value: state.value });
  if (state.status !== "loading") return state;
  const before = state.previous ? entryOf({ value: state.previous }) : null;
  return before?.status === "ready" ? before : { status: "loading" };
}

/**
 * The draft lines planned by `order.previewLines` (ADR 0081), again shortly after the lines,
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
  const { startsAt, endsAt } = period ?? {};
  const planned = lines.map((line) => toPreviewLine({ line }));
  const asking = startsAt && endsAt && planned.length > 0 && nonce >= 0;
  const query = asking ? { customerId, startsAt, endsAt, headcount, lines: planned } : null;
  const state = useLiveQuery({
    input: query ? { input: query, nonce } : null,
    load: preview,
    waitMs: WAIT_MS,
  });
  return draftOf({ state });
}
