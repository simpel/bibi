import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { deliverInboundEmail } from "../src/features/inbound-email/deliver-inbound-email";
import { execute, listInboundEndpoints, setInboundEndpointEmail } from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { inboundMail } from "./inbound-email-helpers";
import { INBOX_DOMAIN, inboxSetup, mailTo, withPermissions } from "./inbound-message-helpers";

const freshLocal = () => `bookings-${createId().slice(0, 10)}`;

describe("inboundEndpoint.setEmail (editable inbox address)", () => {
  it("moves the inbox to the new address and stops the old one", async () => {
    const { context, address, email } = await inboxSetup();
    const localPart = freshLocal();
    const input = { localPart, publicAddress: "bokning@venue.test" };
    const saved = unwrap({
      result: await execute({ operation: setInboundEndpointEmail, input, context }),
    });
    expect(saved).toMatchObject({ id: email.id, localPart, publicAddress: "bokning@venue.test" });
    const message = await mailTo({ recipients: [`${localPart}@${INBOX_DOMAIN}`] });
    expect(message.endpointId).toBe(email.id);
    const old = unwrap({
      result: await deliverInboundEmail({
        mail: inboundMail({ recipients: [address] }),
        domain: INBOX_DOMAIN,
      }),
    });
    expect(old.status).toBe("unmatched");
  });

  it("refuses an address another organization holds with CONFLICT", async () => {
    const a = await inboxSetup();
    const b = await inboxSetup();
    const localPart = freshLocal();
    const input = { localPart, publicAddress: null };
    unwrap({
      result: await execute({ operation: setInboundEndpointEmail, input, context: a.context }),
    });
    const result = await execute({ operation: setInboundEndpointEmail, input, context: b.context });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("refuses reserved and malformed addresses", async () => {
    const { context } = await inboxSetup();
    for (const localPart of ["order-abc", "postmaster", "Has space", "-dash", "a@b"]) {
      const input = { localPart, publicAddress: null };
      const result = await execute({ operation: setInboundEndpointEmail, input, context });
      expect(errorCode({ result }), localPart).toBe("VALIDATION");
    }
  });

  it("needs configuration:write", async () => {
    const { context } = await inboxSetup();
    const input = { localPart: freshLocal(), publicAddress: null };
    const member = peer({ of: context, access: "read" });
    const result = await execute({ operation: setInboundEndpointEmail, input, context: member });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("shows when the newest mail arrived, only with inbox:read", async () => {
    const { context, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const list = async ({ of }: { of: typeof context }) =>
      unwrap({
        result: await execute({ operation: listInboundEndpoints, input: {}, context: of }),
      }).items.find((item) => item.channel === "EMAIL");
    expect((await list({ of: context }))?.lastReceivedAt).toEqual(message.receivedAt);
    const blind = withPermissions({
      of: context,
      permissions: { ...context.permissions, inbox: [] },
    });
    expect((await list({ of: blind }))?.lastReceivedAt).toBeNull();
  });
});
