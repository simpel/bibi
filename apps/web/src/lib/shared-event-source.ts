/** One server-sent event, as the tabs pass it on. */
export type SharedEvent = { type: string; data: string };

export type SharedEventSourceInput = {
  /** The Web Lock and BroadcastChannel name; one stream per name per browser. */
  name: string;
  url: string;
  /** The event types to listen for. */
  types: string[];
  onEvent: (event: SharedEvent) => void;
};

type DirectInput = Omit<SharedEventSourceInput, "name">;

/** A plain EventSource for this tab; returns the close. */
function openDirect({ url, types, onEvent }: DirectInput) {
  const source = new EventSource(url);
  for (const type of types) {
    source.addEventListener(type, (event) =>
      onEvent({ type, data: (event as MessageEvent<string>).data }),
    );
  }
  return () => source.close();
}

/**
 * One EventSource per browser for `name`, however many tabs are open (ADR 0094): the tab holding
 * the Web Lock opens it and relays every event to the other tabs over a BroadcastChannel. When
 * that tab closes, the lock passes to a waiting tab, which opens its own. Browsers without either
 * API open one per tab. Returns the close.
 */
export function openSharedEventSource({ name, url, types, onEvent }: SharedEventSourceInput) {
  if (typeof BroadcastChannel === "undefined" || !navigator.locks) {
    return openDirect({ url, types, onEvent });
  }
  const channel = new BroadcastChannel(name);
  channel.onmessage = (message: MessageEvent<SharedEvent>) => onEvent(message.data);
  const abort = new AbortController();
  let closed = false;
  let release = () => {};
  // The lock can be granted after the close (an abort does not undo a granted request): then
  // give it straight back instead of opening a stream nobody closes on a closed channel.
  const lead = () =>
    new Promise<void>((resolve) => {
      if (closed) return resolve();
      const close = openDirect({
        url,
        types,
        onEvent: (event) => {
          onEvent(event);
          channel.postMessage(event);
        },
      });
      release = () => {
        close();
        resolve();
      };
    });
  // Aborting while waiting rejects the request; that is the normal close of a follower.
  navigator.locks.request(name, { signal: abort.signal }, lead).catch(() => undefined);
  return () => {
    closed = true;
    abort.abort();
    release();
    channel.close();
  };
}
