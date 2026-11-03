import { describe, expect, it } from "vitest";
import { execute, listInboundMessages } from "../src/index";
import { unwrap } from "./helpers";
import { inboxSetup, mailTo } from "./inbound-message-helpers";

describe("searching the inbox (ADR 0085)", () => {
  it("searches the inbox by subject and sender", async () => {
    const { context, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const search = async ({ q }: { q: string }) => {
      const page = unwrap({
        result: await execute({ operation: listInboundMessages, input: { q }, context }),
      });
      return page.items.map((item) => item.id);
    };
    expect(await search({ q: "YOUR TICKET" })).toEqual([message.id]);
    expect(await search({ q: "guest@example" })).toEqual([message.id]);
    expect(await search({ q: "nothing like it" })).toEqual([]);
  });
});
