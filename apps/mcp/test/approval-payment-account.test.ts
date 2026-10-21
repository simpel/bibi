import { setStripeConnectGateway } from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";

afterEach(() => setStripeConnectGateway({ gateway: undefined }));

describe("approval flow: payment account (ADR 0058)", () => {
  it("creates the connected account only after approval, once", async () => {
    const userId = `user_${createId()}`;
    const base = testContext({ actor: { type: "user", userId } });
    const ai = testContext({
      organizationId: base.organizationId,
      actor: { type: "ai", userId, conversationId: "conv_acct" },
    });
    const user = await connect({ context: base });
    const assistant = await connect({ context: ai });
    let created = 0;
    installFakeStripe({ onCreateAccount: () => void created++ });

    const proposal = await call({ client: assistant, name: "paymentAccount_startOnboarding" });
    expect(proposal.data.status, JSON.stringify(proposal.data)).toBe("approval_required");
    expect(created).toBe(0);
    expect(await base.db.paymentAccount.count()).toBe(0);

    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.isError, JSON.stringify(confirmed.data)).toBe(false);
    expect(confirmed.data.onboardingUrl).toContain(confirmed.data.stripeAccountId);
    await call({ client: user, name: "paymentAccount_startOnboarding" });
    expect(created).toBe(1);
  });
});
