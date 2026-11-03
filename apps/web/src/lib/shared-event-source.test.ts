import { afterEach, describe, expect, it, vi } from "vitest";
import { openSharedEventSource } from "./shared-event-source";

class FakeEventSource {
  static opened = 0;
  constructor() {
    FakeEventSource.opened += 1;
  }
  addEventListener() {}
  close() {}
}

/** A lock that is granted only when the test says so, like a tab waiting for another to close. */
function deferredLocks() {
  let grant = () => Promise.resolve();
  const request = (_name: string, _options: unknown, callback: () => Promise<void>) =>
    new Promise<void>((resolve) => {
      grant = () => callback().then(resolve);
    });
  return { locks: { request }, grant: () => grant() };
}

const input = { name: "test-stream", url: "/stream", types: ["unread"], onEvent: () => {} };

describe("openSharedEventSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeEventSource.opened = 0;
  });

  it("opens no stream when the lock is granted after the close", async () => {
    const { locks, grant } = deferredLocks();
    vi.stubGlobal("navigator", { locks });
    vi.stubGlobal("EventSource", FakeEventSource);
    const close = openSharedEventSource(input);
    close();
    await grant();
    expect(FakeEventSource.opened).toBe(0);
  });

  it("opens the stream when it holds the lock", async () => {
    const { locks, grant } = deferredLocks();
    vi.stubGlobal("navigator", { locks });
    vi.stubGlobal("EventSource", FakeEventSource);
    const close = openSharedEventSource(input);
    void grant();
    expect(FakeEventSource.opened).toBe(1);
    close();
  });
});
