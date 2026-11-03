import { describe, expect, it } from "vitest";
import { sendTestInboxMessage } from "../src/features/inbound-message/dev-test-message";
import { execute, getInboundMessage } from "../src/index";
import { unwrap } from "./helpers";
import { inboxSetup } from "./inbound-message-helpers";

describe("the dev menu's test inbox message", () => {
  it("lands unread in the organization's inbox as mail to its address", async () => {
    const { context, email } = await inboxSetup();
    const sent = unwrap({
      result: await sendTestInboxMessage({ organizationId: context.organizationId }),
    });
    const message = unwrap({
      result: await execute({ operation: getInboundMessage, input: { id: sent.id }, context }),
    });
    expect(message).toMatchObject({
      channel: "EMAIL",
      endpointId: email.id,
      ticketId: null,
      readAt: null,
    });
  });
});
