import { INBOUND_CHANNELS, type InboundChannel } from "@bibi/core/schemas";

export type InboxSearchParams = Record<string, string | string[] | undefined>;

/** `/inbox`' URL state: the page cursor, read filter, channel and search (ADR 0085). */
export type InboxParams = {
  cursor: string | undefined;
  read: "unread" | "read" | undefined;
  channel: InboundChannel | undefined;
  q: string | undefined;
};

const first = ({ value }: { value: string | string[] | undefined }) =>
  Array.isArray(value) ? value[0] : value;

/** Hand-edited values fall back to no filter instead of erroring. */
export function readInboxParams({ params }: { params: InboxSearchParams }): InboxParams {
  const read = first({ value: params.read });
  const channel = first({ value: params.channel });
  const q = first({ value: params.q })?.trim();
  const cursor = first({ value: params.cursor });
  return {
    cursor: cursor || undefined,
    read: read === "unread" || read === "read" ? read : undefined,
    channel: INBOUND_CHANNELS.find((value) => value === channel),
    q: q ? q.slice(0, 200) : undefined,
  };
}

/** The filters as the query a link keeps (the cursor is left out: a new filter starts over). */
export function inboxFilterQuery({ params }: { params: InboxParams }): Record<string, string> {
  return {
    ...(params.channel ? { channel: params.channel } : {}),
    ...(params.q ? { q: params.q } : {}),
  };
}
